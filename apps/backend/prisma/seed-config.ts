import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultConfigs = [
  // ─── basic ───────────────────────────────────────────────
  { key: 'app_name',        value: 'GuideReady',        group: 'basic', label: '应用名称',       type: 'string',   description: 'App 显示名称' },
  { key: 'app_logo_url',    value: '',                  group: 'basic', label: 'Logo URL',        type: 'string',   description: 'App Logo 图片链接' },
  { key: 'contact_email',   value: '',                  group: 'basic', label: '联系邮箱',       type: 'string',   description: '客服/联系邮箱地址' },
  { key: 'icp_number',      value: '',                  group: 'basic', label: 'ICP 备案号',     type: 'string',   description: 'ICP 备案号（如 粤ICP备XXXXXXXX号）' },

  // ─── feature ─────────────────────────────────────────────
  { key: 'registration_open',    value: 'true',  group: 'feature', label: '开放注册',         type: 'boolean',  description: '是否允许新用户注册' },
  { key: 'maintenance_mode',     value: 'false', group: 'feature', label: '维护模式',         type: 'boolean',  description: '开启后非管理员用户将看到维护提示' },
  { key: 'maintenance_message',  value: '系统维护中，请稍后再试。', group: 'feature', label: '维护提示文案', type: 'textarea', description: '维护模式下展示的提示信息' },
  { key: 'feature_ai_practice',  value: 'true',  group: 'feature', label: 'AI 练习',          type: 'boolean',  description: '启用/禁用 AI 练习功能' },
  { key: 'feature_leaderboard',  value: 'true',  group: 'feature', label: '排行榜',           type: 'boolean',  description: '启用/禁用排行榜功能' },
  { key: 'feature_mock_exam',    value: 'true',  group: 'feature', label: '模考',             type: 'boolean',  description: '启用/禁用模考功能' },

  // ─── content ─────────────────────────────────────────────
  { key: 'terms_of_service',     value: '', group: 'content', label: '用户协议',         type: 'textarea', description: '用户服务协议全文' },
  { key: 'privacy_policy',       value: '', group: 'content', label: '隐私政策',         type: 'textarea', description: '隐私政策全文' },
  { key: 'children_privacy',     value: '', group: 'content', label: '儿童隐私政策',     type: 'textarea', description: '儿童隐私保护政策' },
  { key: 'sdk_list',             value: '[]', group: 'content', label: 'SDK 列表',       type: 'json',     description: '第三方 SDK 列表（JSON 数组）' },

  // ─── technical ───────────────────────────────────────────
  { key: 'api_rate_limit',       value: '60',  group: 'technical', label: 'API 限流（次/分钟）',  type: 'number',  description: '每个 IP 每分钟最大请求数' },
  { key: 'upload_max_size_mb',   value: '10',  group: 'technical', label: '文件上传限制（MB）',   type: 'number',  description: '单文件上传最大大小（MB）' },
  { key: 'session_timeout_min',  value: '4320',group: 'technical', label: '会话超时（分钟）',     type: 'number',  description: '用户会话过期时间（默认 3 天）' },

  // ─── about ───────────────────────────────────────────────
  { key: 'about_content', value: '',        group: 'about', label: '关于我们', type: 'textarea', description: '关于页面内容' },
  { key: 'app_version',   value: '1.0.0',  group: 'about', label: '版本号',   type: 'string',   description: '当前应用版本（只读参考）' },
];

async function main() {
  console.log('Seeding SystemConfig defaults...');

  for (const cfg of defaultConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: {
        label: cfg.label,
        group: cfg.group,
        type: cfg.type,
        description: cfg.description,
      },
      create: {
        key: cfg.key,
        value: cfg.value,
        group: cfg.group,
        label: cfg.label,
        type: cfg.type,
        description: cfg.description,
      },
    });
    console.log(`  ✓ ${cfg.key}`);
  }

  console.log(`Seeded ${defaultConfigs.length} system config entries.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
