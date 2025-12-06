# Vite+Vue3+TS+Monorepo学习笔记（含问题排查）

## 问：在什么情况下可以切换bun？
个人项目可全量用 Bun（开发 + 生产）；公司项目优先在「开发环境」全量用 Bun（提速无风险），「生产环境」是否用 Bun 仅需验证 3个点：
1. 是否深度依赖 Node 原生 API（如 crypto/fs）；
2. 是否有定制化 npm 流程（如私有源 / 脚本钩子）；
3. 构建产物是否和 npm 一致

# 一、核心知识点汇总

## 1. 环境基础配置

- **运行时选择**：Bun（开发提速，替代npm/yarn）、Node.js（生产打包兼容，推荐20.19+或22.12+）

- **Node版本管理**：使用nvm管理，核心命令：
        安装指定版本：`nvm install 20.18.0`

- 设置默认版本：`nvm alias default 20.18.0`

- 切换版本：`nvm use 20.18.0`

**Monorepo注意点**：依赖需安装在子包（vite-vue3）目录，而非根目录；根目录package.json需设`private: true`

## 2. Vite核心配置（vite.config.ts）

- **根级别配置**：
        `base: './'`：解决打包后路径错误（非根目录部署必备）

- `plugins: [vue()]`：注册Vue插件

**server配置**：
        `port: 5174`：自定义开发端口

`open: true`：启动后自动打开浏览器

`proxy`：跨域代理，如转发/api到localhost:3000

**resolve配置**：`alias: {'@': path.resolve(__dirname, './src')}`，配置@别名（需配合TS配置）

**build配置**：
        `outDir: 'build'`：自定义打包输出目录（默认dist）

`sourcemap: false`：关闭源码映射，减少生产包体积

`minify: 'esbuild'`：使用esbuild压缩（默认，比terser快）

## 3. 环境变量配置

- **文件规则**：
        `.env.development`：开发环境（npm run dev生效）

- `.env.production`：生产环境（npm run build生效）

**命名规则**：变量必须以`VITE_`开头（如VITE_API_URL），否则无法访问

**使用方式**：`import.meta.env.VITE_XXX`（区别于Webpack的process.env）

## 4. 核心插件：unplugin-auto-import

- **作用**：自动导入Vue API（ref、reactive等），无需手动写import语句

- **安装命令**：`bun add -D unplugin-auto-import`（优先用Bun避开npm兼容问题）

- **核心配置**：
        `AutoImport({
  imports: ['vue'], // 自动导入Vue API
  dts: true, // 生成类型声明文件（auto-imports.d.ts）
  dirs: ['src/composables'], // 自动导入指定目录下的API
  eslintrc: { enabled: false } // 暂时关闭eslint干扰
})`

- **类型声明文件**：auto-imports.d.ts（生成在vite-vue3根目录，需加入tsconfig.json的include）

## 5. 生产打包与预览

- **打包命令**：`npm run build`（学习阶段可去掉vue-tsc -b跳过TS检查）

- **预览命令**：使用Vite原生预览（无需装serve），package.json脚本配置：
        `"preview": "vite preview --port 8080 --open"`

- **验证要点**：打包生成build文件夹，预览时页面正常渲染，无路径错误

## 6. 高频面试题（核心答案）

- **Vite和Webpack的核心差异？**：① 开发环境：Vite用浏览器原生ESM按需编译（启动快），Webpack全量打包；② 生产环境：Vite用Rollup打包，Webpack自带打包；③ Vite内置编译能力，无需手动配置loader

- **Vite为什么启动快？**：① 开发环境不做全量打包，按需编译；② 用esbuild做依赖预构建（比babel快20倍）；③ 热更新只更改变动模块，不刷新整个页面

- **Vite如何解决跨域？**：通过server.proxy配置接口代理，将前端请求转发到后端服务器，开启changeOrigin: true模拟跨域请求头

# 二、常见问题及解决方案

## 1. Node版本相关问题

- **问题1**：执行nvm alias default 20.18.0后，node -v仍显示18.20.5
        原因：已打开的终端未加载新配置，或nvm默认版本只对新会话生效

- 解决：① 手动切换：nvm use 20.18.0；② 重启终端（新会话加载默认版本）；③ 终极方案：在~/.zshrc末尾加nvm use 20.18.0 > /dev/null 2>&1，强制启动终端切换

**问题2**：npm run preview提示Vite需要Node.js 20.19+或22.12+
        原因：Vite版本与当前Node版本（20.18.0）的兼容提示，非强制要求

解决：学习阶段可忽略，不影响功能；需消除提示则升级Node：nvm install 20.19.0 && nvm alias default 20.19.0

## 2. Vite配置相关问题

- **问题1**：vite.config.ts中base配置标红，提示“base不在类型BuildEnvironmentOptions中”
        原因：base是根级别配置，误写在build子配置中

- 解决：将base: './'移到defineConfig根级别，与server、build平级

**问题2**：自动生成vite.config.js，导致ts配置不生效
        原因：Vite优先加载vite.config.js，覆盖了vite.config.ts

解决：删除根目录下的vite.config.js，确保只保留vite.config.ts

## 3. 依赖安装与插件相关问题

- **问题1**：npm install -D unplugin-auto-import报错“Cannot read properties of null (reading 'matches')”
        原因：npm缓存/配置异常，与Node 20.18.0兼容性问题

- 解决：① 用Bun安装：bun add -D unplugin-auto-import；② 兜底：npm cache clean --force && npm config delete home后重新安装

**问题2**：页面正常运行，但IDE标红“找不到名称ref/reactive”
        原因：TS未识别auto-imports.d.ts类型声明文件

解决：① 确认auto-imports.d.ts已生成（vite-vue3根目录）；② 将其加入tsconfig.json的include；③ 重启TS服务：Cmd+Shift+P → Restart TS Server

**问题3**：build后未生成auto-imports.d.ts
        原因：vue-tsc类型检查报错中断了插件的生成流程，或dev服务未启动过

解决：启动npm run dev（dev模式无TS检查干扰，插件会完整生成文件）

## 4. 打包与预览相关问题

- **问题1**：bun run build报错“crypto.hash is not a function”
        原因：Bun运行时对Node crypto API实现不完整，与@vitejs/plugin-vue@6.x兼容问题

- 解决：① 改用Node执行打包：nvm use 20 && npm run build；② 兜底：降级插件：bun remove @vitejs/plugin-vue && bun add -D @vitejs/plugin-vue@5.0.4

**问题2**：npm run build报错“Cannot find name 'ref/reactive'”
        原因：vue-tsc类型检查不识别unplugin-auto-import的自动导入API

解决：① 临时方案：修改build脚本为vite build（跳过TS检查）；② 规范方案：在src下创建shims-auto-import.d.ts手动声明全局API，并加入tsconfig.json include

**问题3**：bun run preview报错“Cannot read properties of undefined (reading 'code')”
        原因：serve工具与Bun兼容性问题

解决：改用Vite原生预览，package.json脚本配置为"preview": "vite preview --port 8080 --open"

## 5. IDE相关问题

- **问题**：VSCode搜不到auto-imports.d.ts文件
        原因：① 新生成文件的索引延迟；② 误用文本搜索（Cmd+F）而非文件搜索（Cmd+P）

- 解决：① 用Cmd+P搜索文件名（如auto-imports）；② 刷新资源管理器或重启TS服务；③ 关闭再打开项目重新构建索引

# 三、学习总结

1. 核心目标达成：掌握Vite+Vue3+TS的基础配置、环境变量、生产打包、核心插件使用，以及常见问题排查方法，能独立搭建可运行的前端项目。

2. 关键避坑点：① Node版本需固定（避免自动回退）；② Vite配置注意层级（如base在根级别）；③ 插件生成的类型文件需加入TS配置；④ 生产打包优先用Node执行（兼容性更好）。

3. 工具使用技巧：① 用nvm管理Node版本，Bun提升开发效率；② VSCode搜索文件用Cmd+P，文本搜索用Cmd+Shift+F；③ 新生成文件需刷新索引或重启服务。

4. 后续拓展方向：Vite插件开发、Monorepo优化配置、生产环境部署（如Nginx）、Vite与Pinia/Router的集成。
> （注：文档部分内容可能由 AI 生成）