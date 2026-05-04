const fs = require('fs');
const path = require('path');

const dir = './supabase/migrations';
const files = fs.readdirSync(dir)
  .filter(f => f.startsWith('0') || f.startsWith('2026'))
  .sort();

let enums = [];
let tables = [];
let alters = [];
let policies = [];
let other = [];

// Read all files and concatenate
let fullSql = '';
for (const f of files) {
  fullSql += fs.readFileSync(path.join(dir, f), 'utf8') + '\n\n';
}

// Fix enum values BEFORE parsing
fullSql = fullSql.replace(/'published'/g, "'active'");

// Simple naive block parser
const blocks = fullSql.split(/(?=CREATE TYPE|DO \$\$ BEGIN|CREATE TABLE|ALTER TABLE|CREATE POLICY|DROP POLICY|CREATE VIEW|DROP VIEW|CREATE OR REPLACE FUNCTION|INSERT INTO|NOTIFY)/g);

let consolidated = '-- Consolidated Schema\n\n';

for (let block of blocks) {
  block = block.trim();
  if (!block) continue;
  
  // Skip the commented lines about enums
  if (block.startsWith('-- ALTER TYPE deal_status ADD VALUE')) continue;
  
  // Try to group
  if (block.startsWith('CREATE TYPE') || block.startsWith('DO $$ BEGIN\n    CREATE TYPE') || block.startsWith('DO $$ BEGIN\n    IF NOT EXISTS (SELECT 1 FROM pg_type')) {
    enums.push(block);
  } else if (block.startsWith('CREATE TABLE')) {
    tables.push(block);
  } else if (block.startsWith('ALTER TABLE')) {
    alters.push(block);
  } else if (block.startsWith('CREATE POLICY') || block.startsWith('DROP POLICY')) {
    policies.push(block);
  } else {
    other.push(block);
  }
}

// Deduplicate blocks
const unique = (arr) => [...new Set(arr)];

consolidated += '-- 1. ENUMS\n' + unique(enums).join('\n\n') + '\n\n';
consolidated += '-- 2. TABLES\n' + unique(tables).join('\n\n') + '\n\n';
consolidated += '-- 3. ALTER TABLES\n' + unique(alters).join('\n\n') + '\n\n';
consolidated += '-- 4. POLICIES\n' + unique(policies).join('\n\n') + '\n\n';
consolidated += '-- 5. OTHER (Views, Functions, Triggers)\n' + unique(other).join('\n\n') + '\n';

fs.writeFileSync(path.join(dir, '20260503_consolidated_schema.sql'), consolidated);
console.log('Created 20260503_consolidated_schema.sql');
