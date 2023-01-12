Шаблон для разработки мобильных приложений на React Native

---

## Techstack
[![node](https://img.shields.io/static/v1?label=node&message=14.5.0&color=026E00&style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/en/)
[![react](https://img.shields.io/static/v1?label=react&message=17.0.2&color=61DBFB&style=for-the-badge&logo=react&logoColor=white)](https://ru.reactjs.org/)
[![react native](https://img.shields.io/static/v1?label=react-native&message=0.68.2&color=61DBFB&style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![redux](https://img.shields.io/static/v1?label=redux&message=8.0.2&color=764ABD&style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![redux](https://img.shields.io/static/v1?label=redux%20toolkit&message=1.8.4&color=764ABD&style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)


---

## Работа с шаблоном
В шаблоне все наследуется от стандартного `create-react-native-app`. Однако, в шаблоне присуствуют некоторые архитектурные паттерны:
- `models` - дирректория, которая хранит в себе структуры данных или их типы/интерфейсы/абстракции
- `repositories` - дирректория, которая хранит в себе классы, которые делают запросы по API. Для HTTP запросов внутри есть базовый NetAPI класс, который по DI принимает Http клиент и делает запросы по внешним API. Также есть базовый LocalAPI, который записывает или берет данные с локального хранилища. Для работы с последующими репозиториями, надо наследоваться от одного из базовых классов.
- `services` - дирректория, которая хранит в себе классы, которые производят какие либо вычесления, или служат оберткой для сторонних зависимостей.
- `modules` - дирректория, которая создает контекст для хранения инстанции классов репозиториев или сервисов, для реализации DI(Dependency Injection).

Также, в шаблоне структурированы компоненты по Atomic Design. Компоненты деляться на:

- `/atoms/*` – тут расположены примитивные компоненты: кнопки, заголовки, поля ввода и пр.
- `/molecules/*` – тут расположены связки/группы примитивов: группы кнопок, карточки и пр.
- `/organisms/*` – тут расположены связки/группы молекул. То есть компоненты, которая состоит из молекул, которые состоят из примитивов: шапка, списки карточек, модальные окна и пр.
- `/templates/*` – тут расположены шаблоны страницы

Подробнее можно почитать:

- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/chapter-2/)
- [Atomic Design in practice](https://blog.ippon.tech/atomic-design-in-practice/)

