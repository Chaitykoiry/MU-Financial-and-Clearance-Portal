const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const net = require('net');

const PSQL_PATH = 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe';
const ENV_FILE = path.join(__dirname, '.env');

// Check if PostgreSQL port 5432 is responding
function checkPortOpen(port = 5432, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function askPassword(promptText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function testPostgresPassword(password) {
  try {
    const cmd = `"${PSQL_PATH}" -U postgres -h 127.0.0.1 -p 5432 -d postgres -c "SELECT 1;"`;
    execSync(cmd, {
      env: { ...process.env, PGPASSWORD: password },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return true;
  } catch (err) {
    return false;
  }
}

function createDatabaseIfNotExists(password) {
  try {
    // Check if cpcs_db exists
    const checkCmd = `"${PSQL_PATH}" -U postgres -h 127.0.0.1 -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='cpcs_db';"`;
    const result = execSync(checkCmd, {
      env: { ...process.env, PGPASSWORD: password },
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8'
    }).trim();

    if (result !== '1') {
      console.log('📦 Database "cpcs_db" not found. Creating it now...');
      const createCmd = `"${PSQL_PATH}" -U postgres -h 127.0.0.1 -p 5432 -d postgres -c "CREATE DATABASE cpcs_db;"`;
      execSync(createCmd, {
        env: { ...process.env, PGPASSWORD: password },
        stdio: 'inherit'
      });
      console.log('✓ Database "cpcs_db" created successfully.');
    } else {
      console.log('✓ Database "cpcs_db" already exists.');
    }
    return true;
  } catch (err) {
    console.error('Failed to create/verify database:', err.message);
    return false;
  }
}

function updateEnvFile(password) {
  let envContent = '';
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  }

  const encodedPassword = encodeURIComponent(password);
  const newDbUrl = `DATABASE_URL="postgresql://postgres:${encodedPassword}@localhost:5432/cpcs_db?schema=public"`;

  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(/DATABASE_URL=.*(\r?\n|$)/g, `${newDbUrl}$1`);
  } else {
    envContent += `\n${newDbUrl}\n`;
  }

  fs.writeFileSync(ENV_FILE, envContent, 'utf-8');
  console.log('✓ Updated backend/.env with verified DATABASE_URL.');
}

async function main() {
  console.log('=======================================================');
  console.log('🛠️  CPCS PostgreSQL Automated Setup & Migration Tool');
  console.log('=======================================================');

  // 1. Verify port
  console.log('🔍 Checking PostgreSQL server on port 5432...');
  const isRunning = await checkPortOpen();
  if (!isRunning) {
    console.error('❌ PostgreSQL is not responding on 127.0.0.1:5432.');
    console.error('👉 Please make sure the service "postgresql-x64-18" is running.');
    process.exit(1);
  }
  console.log('✓ PostgreSQL server is active and listening on port 5432.');

  // 2. Determine password
  let password = process.argv[2];

  if (!password && fs.existsSync(ENV_FILE)) {
    const currentEnv = fs.readFileSync(ENV_FILE, 'utf-8');
    const match = currentEnv.match(/DATABASE_URL=["']?postgresql:\/\/postgres:([^@]+)@/);
    if (match && match[1] && match[1] !== 'postgres' && match[1] !== 'YOUR_PASSWORD') {
      console.log('Testing password found in .env...');
      if (testPostgresPassword(decodeURIComponent(match[1]))) {
        password = decodeURIComponent(match[1]);
        console.log('✓ Password from .env authenticated successfully!');
      }
    }
  }

  // If still not known, prompt user
  if (!password) {
    console.log('\n🔑 Authentication required for user "postgres".');
    password = await askPassword('Enter your PostgreSQL master/super-user password: ');
  }

  // 3. Test password
  console.log('\n🔐 Testing PostgreSQL credentials...');
  if (!testPostgresPassword(password)) {
    console.error('❌ Authentication failed: Incorrect password for user "postgres".');
    console.error('👉 Please run again with your correct PostgreSQL password:');
    console.error('   node setup-db.js <your_password>\n');
    process.exit(1);
  }
  console.log('✓ Credentials verified successfully!');

  // 4. Create database
  if (!createDatabaseIfNotExists(password)) {
    process.exit(1);
  }

  // 5. Update .env
  updateEnvFile(password);

  // 6. Push Prisma Schema
  console.log('\n🔄 Generating tables and pushing schema via Prisma...');
  try {
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      cwd: __dirname,
      stdio: 'inherit'
    });
    console.log('✓ Database schema synchronized successfully.');
  } catch (err) {
    console.error('❌ Failed to push Prisma schema.');
    process.exit(1);
  }

  // 7. Seed Data
  console.log('\n🌱 Seeding initial departments, demo accounts, and certificates...');
  try {
    execSync('node prisma/seed.js', {
      cwd: __dirname,
      stdio: 'inherit'
    });
    console.log('✓ Database seeding completed successfully.');
  } catch (err) {
    console.error('❌ Failed to seed database.');
    process.exit(1);
  }

  console.log('\n=======================================================');
  console.log('🎉 PostgreSQL setup completed successfully!');
  console.log('You can now start both servers with:');
  console.log('   npm run dev:backend   (Backend on port 5000)');
  console.log('   npm run dev:frontend  (Frontend on port 5173)');
  console.log('=======================================================');
}

main().catch((err) => {
  console.error('Unexpected error during auto setup:', err);
  process.exit(1);
});

