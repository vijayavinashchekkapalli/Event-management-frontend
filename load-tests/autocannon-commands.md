# Autocannon Commands

Use `NODE_ENV=testing` on the backend to disable rate limiting during load testing.

Replace `http://localhost:5000` with your deployed base URL.

## 100 Concurrent Users

```bash
npx autocannon -c 100 -d 60 http://localhost:5000/health
npx autocannon -c 100 -d 60 http://localhost:5000/api/health
npx autocannon -c 100 -d 60 http://localhost:5000/api/banner
npx autocannon -c 100 -d 60 http://localhost:5000/api/fees/default
npx autocannon -c 100 -d 60 -m POST -H "content-type: application/json" -b '{"firstName":"Test","lastName":"User","phone":"9[<id>]","password":"Password@123","email":"user[<id>]@example.com"}' http://localhost:5000/api/auth/signup
npx autocannon -c 100 -d 60 -m POST -H "content-type: application/json" -b '{"phone":"9999999999","password":"Password@123"}' http://localhost:5000/api/auth/login
npx autocannon -c 100 -d 60 -m POST -H "content-type: application/json" -H "authorization: Bearer <TOKEN>" -b '{"teamName":"Load Test Team","leaderName":"Load Tester","year":"4","stream":"CSE","contact":"9999999999","members":["Member A","Member B"]}' http://localhost:5000/api/teams/register
npx autocannon -c 100 -d 60 -H "authorization: Bearer <TOKEN>" http://localhost:5000/api/admin/dashboard
```

## 500 Concurrent Users

```bash
npx autocannon -c 500 -d 60 http://localhost:5000/health
npx autocannon -c 500 -d 60 http://localhost:5000/api/health
npx autocannon -c 500 -d 60 http://localhost:5000/api/banner
npx autocannon -c 500 -d 60 http://localhost:5000/api/fees/default
npx autocannon -c 500 -d 60 -m POST -H "content-type: application/json" -b '{"firstName":"Test","lastName":"User","phone":"9[<id>]","password":"Password@123","email":"user[<id>]@example.com"}' http://localhost:5000/api/auth/signup
npx autocannon -c 500 -d 60 -m POST -H "content-type: application/json" -b '{"phone":"9999999999","password":"Password@123"}' http://localhost:5000/api/auth/login
npx autocannon -c 500 -d 60 -m POST -H "content-type: application/json" -H "authorization: Bearer <TOKEN>" -b '{"teamName":"Load Test Team","leaderName":"Load Tester","year":"4","stream":"CSE","contact":"9999999999","members":["Member A","Member B"]}' http://localhost:5000/api/teams/register
npx autocannon -c 500 -d 60 -H "authorization: Bearer <TOKEN>" http://localhost:5000/api/admin/dashboard
```

## 1000 Concurrent Users

```bash
npx autocannon -c 1000 -d 60 http://localhost:5000/health
npx autocannon -c 1000 -d 60 http://localhost:5000/api/health
npx autocannon -c 1000 -d 60 http://localhost:5000/api/banner
npx autocannon -c 1000 -d 60 http://localhost:5000/api/fees/default
npx autocannon -c 1000 -d 60 -m POST -H "content-type: application/json" -b '{"firstName":"Test","lastName":"User","phone":"9[<id>]","password":"Password@123","email":"user[<id>]@example.com"}' http://localhost:5000/api/auth/signup
npx autocannon -c 1000 -d 60 -m POST -H "content-type: application/json" -b '{"phone":"9999999999","password":"Password@123"}' http://localhost:5000/api/auth/login
npx autocannon -c 1000 -d 60 -m POST -H "content-type: application/json" -H "authorization: Bearer <TOKEN>" -b '{"teamName":"Load Test Team","leaderName":"Load Tester","year":"4","stream":"CSE","contact":"9999999999","members":["Member A","Member B"]}' http://localhost:5000/api/teams/register
npx autocannon -c 1000 -d 60 -H "authorization: Bearer <TOKEN>" http://localhost:5000/api/admin/dashboard
```

## 5000 Concurrent Users

```bash
npx autocannon -c 5000 -d 60 http://localhost:5000/health
npx autocannon -c 5000 -d 60 http://localhost:5000/api/health
npx autocannon -c 5000 -d 60 http://localhost:5000/api/banner
npx autocannon -c 5000 -d 60 http://localhost:5000/api/fees/default
npx autocannon -c 5000 -d 60 -m POST -H "content-type: application/json" -b '{"firstName":"Test","lastName":"User","phone":"9[<id>]","password":"Password@123","email":"user[<id>]@example.com"}' http://localhost:5000/api/auth/signup
npx autocannon -c 5000 -d 60 -m POST -H "content-type: application/json" -b '{"phone":"9999999999","password":"Password@123"}' http://localhost:5000/api/auth/login
npx autocannon -c 5000 -d 60 -m POST -H "content-type: application/json" -H "authorization: Bearer <TOKEN>" -b '{"teamName":"Load Test Team","leaderName":"Load Tester","year":"4","stream":"CSE","contact":"9999999999","members":["Member A","Member B"]}' http://localhost:5000/api/teams/register
npx autocannon -c 5000 -d 60 -H "authorization: Bearer <TOKEN>" http://localhost:5000/api/admin/dashboard
```
