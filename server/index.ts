import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

// ES modules で __dirname を再現
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set");
  process.exit(1);
}
const openai = new OpenAI({ apiKey });

// MySQLの設定
const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  charset: "utf8mb4",
};

const pool = mysql.createPool(dbConfig);

// unique_idでGET
app.get("/api/presentations/:unique_id", async (req, res) => {
  try {
    const { unique_id } = req.params;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT * FROM presentations WHERE unique_id = ?",
        [unique_id]
      );

      if (Array.isArray(rows) && rows.length > 0) {
        res.json({ exists: true, presentation: rows[0] });
      } else {
        res.status(404).json({ exists: false });
      }
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error checking presentation:", err);
    res.status(500).json({ error: "Failed to check presentation" });
  }
});

// unique_idでDELETE
app.delete("/api/presentations/:unique_id", async (req, res) => {
  try {
    const { unique_id } = req.params;
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        "DELETE FROM presentations WHERE unique_id = ?",
        [unique_id]
      );

      const deleteResult = result as mysql.ResultSetHeader;
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: "Presentation not found" });
      }

      res.json({ message: "Presentation deleted successfully" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error deleting presentation:", err);
    res.status(500).json({ error: "Failed to delete presentation" });
  }
});

//unique_idでPUT
app.put("/api/presentations/:unique_id", async (req, res) => {
  try {
    const { unique_id } = req.params;
    const { title, company, creator, content } = req.body;

    if (!title || !company || !creator || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const connection = await pool.getConnection();
    try {
      const now = new Date();
      const [result] = await connection.execute(
        "UPDATE presentations SET title = ?, company = ?, creator = ?, content = ?, updatedAt = ? WHERE unique_id = ?",
        [title, company, creator, content, now, unique_id]
      );

      const updateResult = result as mysql.ResultSetHeader;
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: "Presentation not found" });
      }

      // 更新したプレゼンテーションを取得して返す
      const [rows] = await connection.execute(
        "SELECT * FROM presentations WHERE unique_id = ?",
        [unique_id]
      );

      res.json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error updating presentation:", err);
    res.status(500).json({ error: "Failed to update presentation" });
  }
});

//dockerDBにPOST
app.post("/api/presentations", async (req, res) => {
  try {
    const { title, company, creator, content, thumbnailUrl } = req.body;

    // バリデーション
    if (!title || !company || !creator) {
      return res.status(400).json({
        error: "title, company, creator are required",
      });
    }

    const connection = await pool.getConnection();
    try {
      // UUID生成（crypto.randomUUID()を使用）
      const unique_id = crypto.randomUUID();

      // 現在の日付（YYYY-MM-DD形式）
      const today = new Date().toISOString().split("T")[0];

      // INSERT実行（戻り値を受け取らない）
      await connection.execute(
        `INSERT INTO presentations 
         (unique_id, title, company, creator, content, createdAt, updatedAt, thumbnailUrl) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          unique_id,
          title,
          company,
          creator,
          content || "",
          today,
          today,
          thumbnailUrl || "",
        ]
      );

      res.status(201).json({
        success: true,
        unique_id: unique_id,
        message: "Presentation created successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error creating presentation:", error);
    res.status(500).json({
      error: "Failed to create presentation",
      details: error.message,
    });
  }
});

// 全プレゼンテーション取得
app.get("/api/presentations", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT * FROM presentations ORDER BY updatedAt DESC"
      );
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error fetching presentations:", err);
    res.status(500).json({ error: "Failed to fetch presentations" });
  }
});

// データベース接続テスト
app.get("/api/health", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      await connection.execute("SELECT 1");
      res.json({ status: "OK", database: "Connected" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ status: "Error", database: "Disconnected" });
  }
});

app.post("/api/generate-text", async (req, res) => {
  try {
    const {
      messages,
      model = "gpt-4-turbo-preview",
      temperature = 0.7,
    } = req.body;
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
    });
    res.json({ text: completion.choices[0]?.message?.content || "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate text" });
  }
});

app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural",
    });
    res.json({ url: response.data![0]!.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// // 特定のプレゼンテーション取得
// app.get("/api/presentations/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const connection = await pool.getConnection();
//     try {
//       const [rows] = await connection.execute(
//         "SELECT * FROM presentations WHERE id = ?",
//         [id]
//       );

//       if (Array.isArray(rows) && rows.length === 0) {
//         return res.status(404).json({ error: "Presentation not found" });
//       }

//       res.json(rows[0]);
//     } finally {
//       connection.release();
//     }
//   } catch (err) {
//     console.error("Error fetching presentation:", err);
//     res.status(500).json({ error: "Failed to fetch presentation" });
//   }
// });

// // プレゼンテーション作成
// app.post("/api/presentations", async (req, res) => {
//   try {
//     const { unique_id, title, company, creator, content } = req.body;

//     if (!unique_id || !title || !company || !creator || !content) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const connection = await pool.getConnection();
//     try {
//       const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 形式
//       const [result] = await connection.execute(
//         "INSERT INTO presentations (unique_id, title, company, creator, content, createdAt, updatedAt, thumbnailUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
//         [unique_id, title, company, creator, content, now, now, ""]
//       );

//       const insertResult = result as mysql.ResultSetHeader;
//       const newId = insertResult.insertId;

//       // 作成したプレゼンテーションを取得して返す
//       const [rows] = await connection.execute(
//         "SELECT * FROM presentations WHERE id = ?",
//         [newId]
//       );

//       res.status(201).json(rows[0]);
//     } finally {
//       connection.release();
//     }
//   } catch (err) {
//     console.error("Error creating presentation:", err);
//     res.status(500).json({ error: "Failed to create presentation" });
//   }
// });

const port = 3001;
app.listen(port, "0.0.0.0", () => {
  // '0.0.0.0'を追加
  console.log(`Server listening on port ${port}`);
});
