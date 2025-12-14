[![NPM version][npm]][npm-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]

[npm]: https://img.shields.io/npm/v/cpcall.svg
[npm-url]: https://npmjs.com/package/cpcall
[size]: https://packagephobia.com/badge?p=cpcall
[size-url]: https://packagephobia.com/result?p=cpcall
[build]: https://github.com/asnowc/cpcall/actions/workflows/ci.yaml/badge.svg?branch=main
[build-url]: https://github.com/asnowc/cpcall/actions

[Document](https://asnowc.github.io/uifx-infinite-wall)

### Usage

```tsx
import { InfiniteWall } from "@uifx/infinite-wall/react";
function Example() {
	return (
		<InfiniteWall
			brickHeight={100}
			brickWidth={50}
			draggable
			zoomControl
			style={{ border: "4px dashed red", height: 400, width: 700 }}
		/>
	);
}
```
