## 一、标准工作流程

1. 开发阶段变更
```
graph LR
    A[修改实体类] --> B[生成迁移脚本]
    B --> C[检查自动生成的SQL]
    C --> D[手动优化迁移脚本]
    D --> E[测试迁移]
```
2.生产环境部署

## 二、是否需要为每个变更创建迁移？

|变更类型| 必须创建迁移	|示例|
|---|---|---|
|新增实体	|✓	|添加@Entity()类|
|新增列	    |✓	|添加@Column()|
|修改列类型	|✓	|varchar→text|
|索引变更	|✓	|添加@Index()|
|数据种子	|可选 |	初始化数据|
|注释修改	|✗	|字段说明变更|

## 三、迁移脚本生成规范
1. 生成命令
```
npx typeorm migration:generate src/migrations/<FeatureName> -d src/data-source.ts
//或者
npx ts-node xx/xx/typeorm/cli migration:generate src/migrations/<FeatureName> -d src/data-source.ts
```

2. 文件命名规则
```
YYYYMMDDHHMM-<feature-name>.ts
示例：202308151210-AddUserAvatar.ts
```

## 四、团队协作规则
1. 版本控制要求

迁移文件必须纳入Git版本控制

禁止修改已提交的迁移文件

冲突解决流程：
```
graph TB
    A[发现冲突] --> B[回滚冲突迁移]
    B --> C[生成新的协调迁移]
    C --> D[重新执行]
```

2. Code Review要点

检查迁移脚本的幂等性

验证up()和down()方法对称性

确认不包含破坏性变更

## 五、生产环境特别规范

1. 变更窗口期

低峰时段执行迁移

大型表变更需分批次执行

2. 回滚方案
```bash
# 单次回滚
npx typeorm migration:revert -d src/data-source.ts

# 多版本回滚（需手动）
npx typeorm query "DELETE FROM migrations WHERE timestamp > XXXX"
```

## 六、自动化集成
1. CI/CD 流水线示例
```yml
steps:
  - name: DB Migration Check
    run: |
      npx typeorm migration:show -d src/data-source.ts
      if grep -q "Pending" <<< $(npx typeorm migration:show); then
        npx typeorm migration:run -d src/data-source.ts
      fi
```

2. 预发布检查清单

迁移脚本测试通过

实体类与数据库结构匹配

回滚方案已验证

## 七、异常处理流程
```
graph TD
    A[迁移失败] --> B[自动回滚]
    B --> C[分析错误日志]
    C --> D{问题类型}
    D -->|结构冲突| E[创建修复迁移]
    D -->|数据问题| F[手动干预]
```

2. 常见问题解决方案

版本不一致：生成协调迁移

外键冲突：临时禁用约束

超时问题：分批执行迁移

遵循这些规范可以确保数据库变更安全可控。建议在项目中维护MIGRATION_GUIDE.md文档记录团队特定规则。