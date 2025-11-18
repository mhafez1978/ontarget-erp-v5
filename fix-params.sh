#!/bin/bash
# Fix all dynamic route params to be Promises in Next.js 16

find app/api -type f -name "route.ts" -path "*/[*]/*" -exec sed -i '' 's/{ params }: { params: { \([^}]*\) }/{ params }: { params: Promise<{ \1 }>/g' {} \;
find app/api -type f -name "route.ts" -path "*/[*]/*" -exec sed -i '' 's/const { \([^}]*\) } = params;/const { \1 } = await params;/g' {} \;

echo "Fixed all dynamic route params!"
