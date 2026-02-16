# Animal Emoji Memory Game

아이들이 할 수 있는 동물 이모지 카드 뒤집기 미니게임입니다.

## 모바일/태블릿에서 바로 접속하는 방법 (GitHub Pages)

이 저장소는 `main` 브랜치에 커밋되면 GitHub Pages로 자동 배포되도록 설정되어 있습니다.

1. GitHub 저장소의 **Settings → Pages**로 이동
2. **Build and deployment**를 **GitHub Actions**로 선택
3. `main` 브랜치에 커밋/푸시
4. 배포 완료 후 아래 형태의 주소로 접속

```text
https://<github-username>.github.io/<repo-name>/
```

예) 저장소가 `minigame`이면:

```text
https://<github-username>.github.io/minigame/
```

## 로컬 실행 (개발용)

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

브라우저에서 `http://127.0.0.1:4173/index.html` 접속
