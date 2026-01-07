# WZHS Booking

## 快速起步

请按照以下步骤完成环境初始化。

### 1. 软件环境准备

请确保系统中已安装以下软件环境。点击展开查看安装指南：

<details>
<summary><b>Node.js (使用 nvm)</b></summary>

1. **安装 nvm**:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   ```
2. **安装 Node.js 20**:
   ```bash
   nvm install 20
   nvm use 20
   ```
</details>

<details>
<summary><b>pnpm</b></summary>

```bash
npm install -g pnpm
```
并在项目根目录安装依赖：
```bash
pnpm install
```
</details>

<details>
<summary><b>PostgreSQL</b></summary>

1. **安装 PostgreSQL (Ubuntu/Debian)**:
   ```bash
   sudo apt update
   sudo apt install -y postgresql postgresql-contrib
   ```

2. **创建数据库及用户**:
   登录到数据库终端：
   ```bash
   sudo -u postgres psql
   ```
   执行基础 SQL 命令：
   ```sql
   CREATE DATABASE wzhs_booking;
   CREATE USER dbuser WITH PASSWORD 'yourpassword';
   GRANT ALL PRIVILEGES ON DATABASE wzhs_booking TO dbuser;
   ```

   **针对 PostgreSQL 15+ 版本** (还需额外授权 schema):
   ```sql
   \c wzhs_booking
   GRANT ALL ON SCHEMA public TO dbuser;
   ```

   退出终端：
   ```sql
   \q
   ```
</details>

### 2. 环境配置
将环境变量模板文件复制为 `.env` 并根据实际情况编辑：
```bash
cp .env.example .env
```
修改 `.env` 中的 `DATABASE_URL`：
```dotenv
DATABASE_URL="postgresql://dbuser:yourpassword@localhost:5432/wzhs_booking"
```

### 3. 数据库初始化
根据您的使用场景，选择以下方式之一初始化数据库：

- **生产环境**
  生成 Prisma Client 并应用现有的迁移记录：
  ```bash
  npx prisma generate
  npx prisma migrate deploy
  ```

- **开发环境**
  同步本地架构修改并生成新迁移：
  ```bash
  npx prisma migrate dev
  ```

### 4. 导入示例数据 (可选)
如果需要初始化系统默认数据或测试数据，请运行：
```bash
node seed.js
```

### 5. 启动服务

- **开发模式**:
  ```bash
  pnpm dev
  ```

- **生产部署**:
  首先执行构建：
  ```bash
  pnpm build
  ```
  然后使用 PM2 启动（推荐）：
  ```bash
  pm2 start .output/server/index.mjs --name wzhs-booking
  ```
