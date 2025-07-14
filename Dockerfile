FROM node:latest


WORKDIR /var/www
#コンテナ内に作業ディレクトリをver/wwwを作ります
# 作業ディレクトリ
#以降に続くrun env コマンドを実行する場所として使う、作業ディレクトリを指定します。

RUN apt update && apt -y install locales && \
    localedef -f UTF-8 -i ja_JP ja_JP.UTF-8
#コンテナのビルド時に使用される命令の一つ

ENV LANG ja_JP.UTF-8ENV=LANGUAGE ja_JP:ja
ENV LC_ALL=ja_JP.UTF-8
ENV TZ=JST-9
ENV TERM=xterm

# Vimインストール
RUN apt install -y vim
#コンテナのビルド時に使用される命令の一つ

# package.json だけを先にコピー（Docker キャッシュ活用）
COPY package*.json ./

# 依存関係をインストール（これは必要）
RUN npm install



#Docker の動作原理

# イメージ作成時（docker-compose build）

# Dockerfile に従ってコンテナイメージが作成される
# この時点で、Dockerfile に書かれた COPY 命令がないと、ファイルがイメージに含まれない


# コンテナ起動時（docker-compose up）

# 作成されたイメージからコンテナが起動される
# docker-compose.yml の volumes でマウントが行われる