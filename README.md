# SaleScout: мини-версия прайс-бота

Тестовое задание для стажёра (web-разработчик). Бот берёт минимальную цену конкурентов, которые есть в наличии, становится чуть дешевле и не выходит за границы `minPrice` / `maxPrice`.

## Стек

Node.js 20, TypeScript, Express, Vitest, Supertest, React + Vite.

## Структура

```
src/pricing.ts      calculatePrice: чистая функция расчёта цены
src/types.ts        типы Product, PriceResult и др.
src/app.ts          Express-приложение (POST /reprice, валидация)
src/server.ts       запуск сервера (порт 3001)
src/*.test.ts       тесты (Vitest)
data/               пример входных данных и ожидаемый результат
web/                React-страница (Vite)
```

## Установка

Нужен Node.js 20 или новее.

```bash
npm install
npm --prefix web install
```

## Запуск

Сервер и фронтенд запускаются в двух разных терминалах из корня репозитория.

```bash
# терминал 1: API на http://localhost:3001
npm run dev:server

# терминал 2: страница на http://localhost:5173
npm run dev:web
```

Откройте http://localhost:5173. Таблица «было / стало» загружается запросом `POST /reprice`. Vite проксирует `/reprice` на сервер, поэтому CORS настраивать не нужно.

## Тесты и проверка типов

```bash
npm test            # тесты calculatePrice и API
npm run typecheck   # tsc --noEmit
```

## API

`POST /reprice`, `Content-Type: application/json`, тело: массив `Product[]`.

- `200`: массив `PriceResult[]` в том же порядке.
- `400`: тело не массив, невалидный JSON или невалидный товар (в ответе указан индекс товара).

Пример:

```bash
curl -X POST http://localhost:3001/reprice \
  -H "Content-Type: application/json" \
  -d @data/products.json
```

## Правила расчёта

1. Учитываются только конкуренты с `inStock: true`.
2. Таких конкурентов нет: `newPrice = maxPrice`, причина `NO_COMPETITORS`.
3. Иначе `best` — минимальная цена среди них, `candidate = floor(best - step)`.
4. `candidate < minPrice`: `minPrice`, `AT_MIN`. `candidate > maxPrice`: `maxPrice`, `AT_MAX`. Иначе `candidate`, `UNDERCUT` (границы включительно).
5. `myPrice` на расчёт не влияет, он возвращается только как `oldPrice`.

### Замечание про числа с плавающей точкой

`best - step` может дать результат вроде `1.9999999999999998` вместо `2`. Обычный `Math.floor` дал бы `1`, то есть на тенге меньше, чем при расчёте в десятичной арифметике. Поэтому перед округлением значение, которое отличается от целого меньше чем на `1e-9`, считается целым (функция `floorSafe` в `src/pricing.ts`). Это покрыто тестом.
