# hamhibokka-backend

NestJS + GraphQL + MongoDB + S3 기반 백엔드 프로젝트

## 주요 기술 스택
- [NestJS](https://nestjs.com/)
- [GraphQL (Apollo)](https://www.apollographql.com/)
- [MongoDB (Mongoose)](https://mongoosejs.com/)
- [AWS S3](https://aws.amazon.com/ko/s3/) (이미지 업로드)
- JWT 인증

## 프로젝트 구조
- `src/`
  - `auth/` : 인증, JWT, 회원가입/로그인
  - `users/` : 사용자 관리
  - `goals/` : 목표 관리
  - `follows/` : 팔로우 관리
  - `stickers/` : 스티커 관리
  - `sticker-images/` : 스티커 이미지 관리 (S3 업로드/DB 저장)
  - `upload/` : 파일 업로드 REST API
  - `schemas/` : Mongoose 스키마
  - `config/`, `database/` : 환경설정, DB연결

## 환경 변수 (.env 예시)
```
MONGODB_URI=mongodb://localhost:27017/hamhibokka
JWT_SECRET=your-jwt-secret
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=your-bucket
AWS_CLOUDFRONT_DOMAIN=your-cloudfront-domain (선택)
```

## 실행 방법
```bash
npm install
npm run start:dev
```

## GraphQL Playground
- http://localhost:3000/graphql
- Playground에서 쿼리/뮤테이션 테스트 가능

## 주요 GraphQL 예시

### 회원가입 (createUser)
```graphql
mutation {
  createUser(input: {
    userId: "testuser123"
    email: "testuser123@example.com"
    nickname: "테스트유저"
    password: "securePassword123"
    profileImage: "https://example.com/profile.png"
  }) {
    id
    userId
    email
    nickname
    profileImage
  }
}
```

### 로그인 (register, login)
```graphql
mutation {
  register(registerInput: {
    email: "testuser123@example.com"
    password: "securePassword123"
    nickname: "테스트유저"
  }) {
    accessToken
    user {
      id
      userId
      email
      nickname
    }
  }
}
```

### 내 스티커 이미지 목록
```graphql
query {
  myStickerImages {
    id
    stickerImageId
    name
    imageUrl
    thumbnailUrl
    isDefault
    category
    uploadedBy
    createdAt
  }
}
```

## REST API 예시 (파일 업로드)

### 스티커 이미지 업로드
- **POST** `/upload/sticker-image`
- 헤더: `Authorization: Bearer <JWT 토큰>`
- FormData:
  - `file`: 이미지 파일
  - `name`: 이미지 이름
  - `category`: (선택) 카테고리

#### 예시 (curl)
```bash
curl -X POST http://localhost:3000/upload/sticker-image \
  -H "Authorization: Bearer <JWT 토큰>" \
  -F "file=@/path/to/image.png" \
  -F "name=스티커이름" \
  -F "category=기본"
```

## S3 업로드 및 DB 저장
- 업로드된 이미지는 S3에 저장되고, DB(MongoDB)에도 이미지 정보가 저장됩니다.
- DB에는 stickerImageId, name, imageUrl, thumbnailUrl, uploadedBy, createdAt 등이 저장됩니다.

## 기타
- 환경변수, DB, S3, JWT 등 실제 운영 환경에 맞게 설정 필요
- 자세한 GraphQL 타입/쿼리/뮤테이션은 `/src/schema.gql` 참고

---

