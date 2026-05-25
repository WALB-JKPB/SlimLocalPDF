# SlimLocalPDF

일반 PDF 압축과 공공기관 제출용 PDF 준비를 브라우저 안에서 처리하는 로컬 도구입니다.

## Principles

- 사용자의 PDF는 서버로 업로드하지 않습니다.
- 페이지 수 확인, N-up 배치, 압축, 다운로드 준비는 브라우저에서 실행합니다.
- 처리 로직은 저장소에 공개해 직접 검증할 수 있게 유지합니다.

## Current Features

- PDF 파일 검증
- 실제 PDF 페이지 수 읽기
- 참고용 용량/장수 preset
- 최대 제출 장수 기준 N-up 자동 계산
- pdfcpu WASM 1차 최적화
- Ghostscript WASM 단계별 압축
- pdf-lib 기반 fallback 재저장
- Web Worker 기반 PDF 처리와 메인 스레드 fallback
- 처리 단계별 진행 상태 표시
- 결과 PDF 다운로드 제공

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Privacy

PDF 처리는 브라우저 메모리와 브라우저 다운로드 기능을 사용합니다. 이 앱은 PDF 파일을 별도 서버로 전송하지 않는 구조를 목표로 합니다.

## License Notes

SlimLocalPDF is distributed under AGPL-3.0-or-later. See [LICENSE](./LICENSE).

This project includes Ghostscript/GhostPDL WebAssembly files through `@okathira/ghostpdl-wasm`, which is also licensed under AGPL-3.0-or-later. See [NOTICE](./NOTICE) for third-party notices.
