// DDL - Supabase数据库Schema定义
// 请在Supabase SQL编辑器中执行以下SQL

ex-- 启用PostGIS扩展(可选)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 客户表
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  industry VARCHAR(100),
  status VARCHAR(50) DEFAULT 'lead' CHECK (status IN ('lead', 'prospect', 'customer', 'inactive')),
  source VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 联系人表
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 销售机会表
CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  value DECIMAL(15, 2) DEFAULT 0,
  stage VARCHAR(50) DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost')),
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'other' CHECK (type IN ('call', 'meeting', 'email', 'follow_up', 'other')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  related_customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  related_opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 活动日志表
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE SET NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_industry ON customers(industry);
CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer_id ON opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_activities_customer_id ON activities(customer_id);

-- 插入示例数据
INSERT INTO customers (name, email, phone, company, industry, status, source, notes) VALUES
('张三', 'zhangsan@example.com', '13800138000', '阿里巴巴', '互联网', 'customer', '广告投放', '重要客户，年度合作'),
('李四', 'lisi@example.com', '13800138001', '腾讯科技', '互联网', 'customer', '老客户介绍', '决策人态度积极'),
('王五', 'wangwu@example.com', '13800138002', '字节跳动', '互联网', 'prospect', '线上咨询', '需要跟进'),
('赵六', 'zhaoliu@example.com', '13800138003', '美团', '本地生活', 'lead', '展会', '新线索'),
('孙七', 'sunqi@example.com', '13800138004', '京东', '电商', 'prospect', '电话营销', '预算充足'),
('周八', 'zhouba@example.com', '13800138005', '拼多多', '电商', 'inactive', '广告投放', '暂时无需求'),
('吴九', 'wujiu@example.com', '13800138006', '网易', '互联网', 'customer', '老客户介绍', '续约客户'),
('郑十', 'zhengshi@example.com', '13800138007', '百度', '互联网', 'lead', '官网', '刚注册试用');

INSERT INTO contacts (customer_id, name, email, phone, position, is_primary) VALUES
(1, '张总', 'zhangsan@alibaba.com', '13800138000', 'CEO', true),
(1, '李经理', 'lili@alibaba.com', '13800138010', '采购经理', false),
(2, '马化腾', 'pony@tencent.com', '13800138001', 'CEO', true),
(3, '王兴', 'wangxing@bytedance.com', '13800138002', 'CTO', true),
(4, '王慧', 'wanghui@meituan.com', '13800138003', '运营总监', true);

INSERT INTO opportunities (customer_id, title, value, stage, probability, expected_close_date, notes) VALUES
(1, '年度企业服务合同', 500000, 'negotiation', 80, '2026-02-15', '对方正在内部审批'),
(2, '云服务器扩容项目', 200000, 'proposal', 60, '2026-03-01', '已发送方案'),
(3, '营销工具采购', 80000, 'qualification', 40, '2026-03-15', '需求确认中'),
(4, '数据分析平台', 150000, 'prospecting', 20, '2026-04-01', '刚接触'),
(5, 'CRM系统实施', 300000, 'won', 100, '2026-01-20', '已签约'),
(5, '培训服务', 50000, 'lost', 0, '2026-01-10', '竞争对手低价获取');

INSERT INTO tasks (title, description, type, priority, status, due_date, related_customer_id, related_opportunity_id) VALUES
('电话回访张总', '跟进合同审批进度', 'call', 'high', 'pending', '2026-01-25', 1, 1),
('发送产品演示', '发送最新产品功能演示视频', 'email', 'medium', 'in_progress', '2026-01-26', 3, 3),
('客户拜访', '上门拜访字节跳动CTO', 'meeting', 'high', 'pending', '2026-01-28', 3, 3),
('报价单确认', '确认云服务器扩容方案报价', 'follow_up', 'medium', 'completed', '2026-01-20', 2, 2),
('合同审核', '审核年度服务合同条款', 'other', 'high', 'pending', '2026-01-27', 1, 1);

INSERT INTO activities (type, description, customer_id, created_at) VALUES
('created_customer', '创建客户档案', 1, '2026-01-15 09:00:00'),
('updated_opportunity', '更新销售机会阶段', 1, '2026-01-18 14:30:00'),
('completed_task', '完成任务: 报价单确认', 2, '2026-01-20 16:00:00'),
('created_customer', '创建客户档案', 3, '2026-01-19 10:00:00'),
('won_opportunity', '销售机会赢单', 5, '2026-01-20 11:00:00');
