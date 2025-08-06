// import { describe, it, expect, beforeAll, afterAll } from "vitest";

// const API_BASE = "http://localhost:3001";

// // テスト用のサンプルデータ
// const samplePresentation = {
//   title: "Test Presentation",
//   company: "Test Company",
//   creator: "Test Creator",
//   content: "# Test Content\n\n- Test bullet point",
//   thumbnailUrl: "https://example.com/image.jpg",
// };

// describe("API Integration Tests", () => {
//   let createdUniqueId: string;

//   beforeAll(async () => {
//     // サーバーが起動しているかチェック
//     try {
//       const response = await fetch(`${API_BASE}/api/health`);
//       if (!response.ok) {
//         throw new Error("Server is not running");
//       }
//     } catch (error) {
//       console.error("Server health check failed:", error);
//       throw new Error("Please make sure the server is running on port 3001");
//     }
//   });

//   afterAll(async () => {
//     // テスト後のクリーンアップ（作成したデータを削除）
//     if (createdUniqueId) {
//       try {
//         await fetch(`${API_BASE}/api/presentations/${createdUniqueId}`, {
//           method: "DELETE",
//         });
//       } catch (error) {
//         console.warn("Cleanup failed:", error);
//       }
//     }
//   });

//   describe("POST /api/presentations", () => {
//     it("should create a new presentation successfully", async () => {
//       const response = await fetch(`${API_BASE}/api/presentations`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(samplePresentation),
//       });

//       expect(response.status).toBe(201);

//       const result = await response.json();
//       expect(result.success).toBe(true);
//       expect(result.unique_id).toBeDefined();
//       expect(typeof result.unique_id).toBe("string");
//       expect(result.message).toBe("Presentation created successfully");

//       // 後続のテストで使用するためにIDを保存
//       createdUniqueId = result.unique_id;
//     });

//     it("should return 400 when required fields are missing", async () => {
//       const incompleteData = {
//         title: "Test Title",
//         // company と creator が不足
//       };

//       const response = await fetch(`${API_BASE}/api/presentations`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(incompleteData),
//       });

//       expect(response.status).toBe(400);

//       const result = await response.json();
//       expect(result.error).toBe("title, company, creator are required");
//     });
//   });

//   describe("GET /api/presentations", () => {
//     it("should get all presentations", async () => {
//       const response = await fetch(`${API_BASE}/api/presentations`);

//       expect(response.status).toBe(200);

//       const result = await response.json();
//       expect(Array.isArray(result)).toBe(true);

//       // 作成したプレゼンテーションが含まれているかチェック
//       if (createdUniqueId) {
//         const createdPresentation = result.find(
//           (p: any) => p.unique_id === createdUniqueId
//         );
//         expect(createdPresentation).toBeDefined();
//         expect(createdPresentation.title).toBe(samplePresentation.title);
//       }
//     });
//   });

//   describe("PUT /api/presentations/:unique_id", () => {
//     it("should update presentation successfully", async () => {
//       if (!createdUniqueId) {
//         throw new Error("No presentation created for update test");
//       }

//       const updatedData = {
//         title: "Updated Title",
//         company: "Updated Company",
//         creator: "Updated Creator",
//         content: "# Updated Content\n\n- Updated bullet point",
//       };

//       const response = await fetch(
//         `${API_BASE}/api/presentations/${createdUniqueId}`,
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(updatedData),
//         }
//       );

//       expect(response.status).toBe(200);

//       const result = await response.json();
//       expect(result.title).toBe(updatedData.title);
//       expect(result.company).toBe(updatedData.company);
//       expect(result.creator).toBe(updatedData.creator);
//       expect(result.content).toBe(updatedData.content);
//     });

//     it("should return 404 when presentation not found", async () => {
//       const nonExistentId = "non-existent-id";
//       const updatedData = {
//         title: "Updated Title",
//         company: "Updated Company",
//         creator: "Updated Creator",
//         content: "Updated Content",
//       };

//       const response = await fetch(
//         `${API_BASE}/api/presentations/${nonExistentId}`,
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(updatedData),
//         }
//       );

//       expect(response.status).toBe(404);

//       const result = await response.json();
//       expect(result.error).toBe("Presentation not found");
//     });
//   });

//   describe("DELETE /api/presentations/:unique_id", () => {
//     it("should return 404 when presentation not found", async () => {
//       const nonExistentId = "non-existent-id";

//       const response = await fetch(
//         `${API_BASE}/api/presentations/${nonExistentId}`,
//         {
//           method: "DELETE",
//         }
//       );

//       expect(response.status).toBe(404);

//       const result = await response.json();
//       expect(result.error).toBe("Presentation not found");
//     });

//     it("should delete presentation successfully", async () => {
//       if (!createdUniqueId) {
//         throw new Error("No presentation created for delete test");
//       }

//       const response = await fetch(
//         `${API_BASE}/api/presentations/${createdUniqueId}`,
//         {
//           method: "DELETE",
//         }
//       );

//       expect(response.status).toBe(200);

//       const result = await response.json();
//       expect(result.message).toBe("Presentation deleted successfully");

//       // 削除されたことを確認するため、GETで確認
//       const getResponse = await fetch(`${API_BASE}/api/presentations`);
//       const presentations = await getResponse.json();
//       const deletedPresentation = presentations.find(
//         (p: any) => p.unique_id === createdUniqueId
//       );
//       expect(deletedPresentation).toBeUndefined();

//       // クリーンアップ用のIDをリセット
//       createdUniqueId = "";
//     });
//   });
// });
