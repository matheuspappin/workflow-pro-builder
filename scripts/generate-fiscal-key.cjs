#!/usr/bin/env node
const crypto = require('crypto')
const key = crypto.randomBytes(32).toString('hex')
console.log('\nAdicione ao .env:\n')
console.log('CERT_ENCRYPTION_KEY=' + key)
console.log('\n')
