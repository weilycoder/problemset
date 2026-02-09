# Problem Set Management System

一个基于 Cloudflare Workers 和 KV 存储的简单题目管理系统。

其实也可以看作文章管理系统，只是被我用于管理题目。

## 功能

- 查看题目列表
- 查看题目详情
- 提交新题目（需要管理员密钥）
- 删除题目（需要管理员密钥）

## 部署和开发

1. 克隆仓库：

    ```bash
    git clone <repository_url>
    cd problemset
    ```

2. 安装依赖：

    ```bash
    npm install
    ```

3. 配置 Cloudflare Workers：

    - 创建 KV 命名空间 `PROBLEMSET`：

        ```bash
        npx wrangler kv namespace create PROBLEMSET 
        ```

    - 在 `wrangler.toml` 中添加 KV 绑定：

        ```toml
        [[kv_namespaces]]
        binding = "PROBLEMSET"
        id = "<your_kv_namespace_id>"
        ```

    - 确定管理员密钥环境变量 `PASS_KEY`，计算其 SHA-512 哈希值。一个基于 Python 的命令如下：

        ```bash
        python -c "print(__import__('hashlib').sha512(__import__('getpass').getpass().encode()).hexdigest())"
        ```

    - 在 `wrangler.toml` 中添加环境变量：

        ```toml
        [vars]
        PASS_KEY = "<your_hashed_pass_key>"
        ```

        如果你连 SHA-512 哈希值也不想泄露，可以使用 secret：

        ```bash
        npx wrangler secret put PASS_KEY
        ```

        同时，你需要在本地添加 `.dev.vars` 文件，内容如下（如果需要本地调试）：

        ```env
        PASS_KEY="<your_hashed_pass_key>"
        ```

        记得将 `.dev.vars` 添加到 `.gitignore` 中以防止泄露。

4. 本地调试：

    ```bash
    npm run dev
    ```

5. 部署到 Cloudflare Workers：

    ```bash
    npm run deploy
    ```

## 感谢

- 感谢 [Cloudflare](https://www.cloudflare.com/) 提供的平台，使得部署和管理变得非常简单。
- 感谢 [markdeep](https://casual-effects.com/markdeep/) 提供的简易 Markdown 渲染工具。
