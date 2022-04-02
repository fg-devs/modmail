#!/bin/bash
npm exec prisma db push
node ./build/app.js
