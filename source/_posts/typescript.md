---
title: TypeScript 学习
tags: [TS]
categories: [前端]
index_img: /img/web/tslogo.png
banner_img: /img/bg/about.jpg
date: 2023-09-09 20:29:00
excerpt: TS 语法
---

记录一些学习的 TS 语法。学习内容来自 [阮一峰](https://wangdoc.com/typescript/)

## 值类型

TypeScript 规定，单个值也是一种类型，称为“值类型”。

```tsx
let x:'hello';

x = 'hello'; // 正确
x = 'world'; // 报错
```

上面示例中，变量`x`的类型是字符串`hello`，导致它只能赋值为这个字符串，赋值为其他字符串就会报错。

TypeScript 推断类型时，遇到`const`命令声明的变量，如果代码里面没有注明类型，就会推断该变量是值类型。

```tsx
// x 的类型是 "https"
const x = 'https';

// y 的类型是 string
const y:string = 'https';
```

上面示例中，变量`x`是`const`命令声明的，TypeScript 就会推断它的类型是值`https`，而不是`string`类型。

这样推断是合理的，因为`const`命令声明的变量，一旦声明就不能改变，相当于常量。值类型就意味着不能赋为其他值。

注意，`const`命令声明的变量，如果赋值为对象，并不会推断为值类型。

```tsx
// x 的类型是 { foo: number }
const x = { foo: 1 };
```

值类型可能会出现一些很奇怪的报错。

```tsx
const x:5 = 4 + 1; // 报错
```

上面示例中，等号左侧的类型是数值`5`，等号右侧`4 + 1`的类型，TypeScript 推测为`number`。由于`5`是`number`的子类型，`number`是`5`的父类型，父类型不能赋值给子类型，所以报错了

但是，反过来是可以的，子类型可以赋值给父类型。

```tsx
let x:5 = 5;
let y:number = 4 + 1;

x = y; // 报错
y = x; // 正确
```

如果一定要让子类型可以赋值为父类型的值，就要用到类型断言

```tsx
const x:5 = (4 + 1) as 5; // 正确
```

## 交叉类型

交叉类型（intersection types）指的多个类型组成的一个新类型，使用符号`&`表示。

交叉类型`A&B`表示，任何一个类型必须同时属于`A`和`B`，才属于交叉类型`A&B`，即交叉类型同时满足`A`和`B`的特征。

```tsx
let x:number&string;
```

上面示例中，变量`x`同时是数值和字符串，这当然是不可能的，所以 TypeScript 会认为`x`的类型实际是`never`。

交叉类型的主要用途是表示对象的合成。

```tsx
let obj:
  { foo: string } &
  { bar: string };

obj = {
  foo: 'hello',
  bar: 'world'
};
```

上面示例中，变量`obj`同时具有属性`foo`和属性`bar`。

交叉类型常常用来为对象类型添加新属性。

```tsx
type A = { foo: number };

type B = A & { bar: number };
```

上面示例中，类型`B`是一个交叉类型，用来在`A`的基础上增加了属性`bar`。

## type 命令

`type`命令用来定义一个类型的别名。

```tsx
type Age = number;

let age:Age = 55;
```

上面示例中，`type`命令为`number`类型定义了一个别名`Age`。这样就能像使用`number`一样，使用`Age`作为类型。

别名可以让类型的名字变得更有意义，也能增加代码的可读性，还可以使复杂类型用起来更方便，便于以后修改变量的类型。

别名不允许重名。

```tsx
type Color = 'red';
type Color = 'blue'; // 报错
```

上面示例中，同一个别名`Color`声明了两次，就报错了。

别名的作用域是块级作用域。这意味着，代码块内部定义的别名，影响不到外部。

```tsx
type Color = 'red';

if (Math.random() < 0.5) {
  type Color = 'blue';
}
```

上面示例中，`if`代码块内部的类型别名`Color`，跟外部的`Color`是不一样的。

别名支持使用表达式，也可以在定义一个别名时，使用另一个别名，即别名允许嵌套。

```tsx
type World = "world";
type Greeting = `hello ${World}`;
```

上面示例中，别名`Greeting`使用了模板字符串，读取另一个别名`World`。

`type`命令属于类型相关的代码，编译成 JavaScript 的时候，会被全部删除。

## interface

interface 可以使用`extends`关键字，继承其他 interface。

```tsx
interface Shape {
  name: string;
}

interface Circle extends Shape {
  radius: number;
}
```

interface 允许多重继承。

```tsx
interface Style {
  color: string;
}

interface Shape {
  name: string;
}

interface Circle extends Style, Shape {
  radius: number;
}
```

上面示例中，`Circle`同时继承了`Style`和`Shape`，所以拥有三个属性`color`、`name`和`radius`。

多重接口继承，实际上相当于多个父接口的合并。

interface 可以继承`type`命令定义的对象类型。

```tsx
type Country = {
  name: string;
  capital: string;
}

interface CountryWithPop extends Country {
  population: number;
}
```

上面示例中，`CountryWithPop`继承了`type`命令定义的`Country`对象，并且新增了一个`population`属性。

注意，如果`type`命令定义的类型不是对象，interface 就无法继承。

多个同名接口会合并成一个接口。

```tsx
interface Box {
  height: number;
  width: number;
}

interface Box {
  length: number;
}
```

上面示例中，两个`Box`接口会合并成一个接口，同时有`height`、`width`和`length`三个属性。

## * interface 与 type 的异同

`interface`命令与`type`命令作用类似，都可以表示对象类型。

很多对象类型既可以用 interface 表示，也可以用 type 表示。而且，两者往往可以换用，几乎所有的 interface 命令都可以改写为 type 命令。

它们的相似之处，首先表现在都能为对象类型起名。

```tsx
type Country = {
  name: string;
  capital: string;
}

interface Coutry {
  name: string;
  capital: string;
}
```

上面示例是`type`命令和`interface`命令，分别定义同一个类型。

`class`命令也有类似作用，通过定义一个类，同时定义一个对象类型。但是，它会创造一个值，编译后依然存在。如果只是单纯想要一个类型，应该使用`type`或`interface`。

interface 与 type 的区别有下面几点。

（1）`type`能够表示非对象类型，而`interface`只能表示对象类型（包括数组、函数等）。

（2）`interface`可以继承其他类型，`type`不支持继承。

继承的主要作用是添加属性，`type`定义的对象类型如果想要添加属性，只能使用`&`运算符，重新定义一个类型。

```tsx
type Animal = {
  name: string
}

type Bear = Animal & {
  honey: boolean
}
```

上面示例中，类型`Bear`在`Animal`的基础上添加了一个属性`honey`。

上例的`&`运算符，表示同时具备两个类型的特征，因此可以起到两个对象类型合并的作用。

作为比较，`interface`添加属性，采用的是继承的写法。

```tsx
interface Animal {
  name: string
}

interface Bear extends Animal {
  honey: boolean
}
```

继承时，type 和 interface 是可以换用的。interface 可以继承 type。

```tsx
type Foo = { x: number; };

interface Bar extends Foo {
  y: number;
}
```

type 也可以继承 interface。

```tsx
interface Foo {
  x: number;
}

type Bar = Foo & { y: number; };
```

（3）同名`interface`会自动合并，同名`type`则会报错。也就是说，TypeScript 不允许使用`type`多次定义同一个类型。

```tsx
type A = { foo:number }; // 报错
type A = { bar:number }; // 报错
```

上面示例中，`type`两次定义了类型`A`，导致两行都会报错。

作为比较，`interface`则会自动合并。

```tsx
interface A { foo:number };
interface A { bar:number };

const obj:A = {
  foo: 1,
  bar: 1
};
```

上面示例中，`interface`把类型`A`的两个定义合并在一起。

这表明，interface 是开放的，可以添加属性，type 是封闭的，不能添加属性，只能定义新的 type。

（4）`interface`不能包含属性映射（mapping），`type`可以。

```tsx
interface Point {
  x: number;
  y: number;
}

// 正确
type PointCopy1 = {
  [Key in keyof Point]: Point[Key];
};

// 报错
interface PointCopy2 {
  [Key in keyof Point]: Point[Key];
};
```

（5）`this`关键字只能用于`interface`。

```tsx
// 正确
interface Foo {
  add(num:number): this;
};

// 报错
type Foo = {
  add(num:number): this;
};
```

上面示例中，type 命令声明的方法`add()`，返回`this`就报错了。interface 命令没有这个问题。

下面是返回`this`的实际对象的例子。

```tsx
class Calculator implements Foo {
  result = 0;
  add(num:number) {
    this.result += num;
    return this;
  }
}
```

（6）type 可以扩展原始数据类型，interface 不行。

```tsx
// 正确
type MyStr = string & {
  type: 'new'
};

// 报错
interface MyStr extends string {
  type: 'new'
}
```

上面示例中，type 可以扩展原始数据类型 string，interface 就不行。

（7）`interface`无法表达某些复杂类型（比如交叉类型和联合类型），但是`type`可以。

```tsx
type A = { /* ... */ };
type B = { /* ... */ };

type AorB = A | B;
type AorBwithName = AorB & {
  name: string
};
```

上面示例中，类型`AorB`是一个联合类型，`AorBwithName`则是为`AorB`添加一个属性。这两种运算，`interface`都没法表达。

综上所述，如果有复杂的类型运算，那么没有其他选择只能使用`type`；一般情况下，`interface`灵活性比较高，便于扩充类型或自动合并，建议优先使用。

## class

### 1. 属性索引

类允许定义属性索引。

```tsx
class MyClass {
  [s:string]: boolean |
    ((s:string) => boolean);

  get(s:string) {
    return this[s] as boolean;
  }
}
```

上面示例中，`[s:string]`表示所有属性名类型为字符串的属性，它们的属性值要么是布尔值，要么是返回布尔值的函数。

注意，由于类的方法是一种特殊属性（属性值为函数的属性），所以属性索引的类型定义也涵盖了方法。如果一个对象同时定义了属性索引和方法，那么前者必须包含后者的类型。

```tsx
class MyClass {
  [s:string]: boolean;
  f() { // 报错
    return true;
  }
}
```

上面示例中，属性索引的类型里面不包括方法，导致后面的方法`f()`定义直接报错。正确的写法是下面这样。

```tsx
class MyClass {
  [s:string]: boolean | (() => boolean);
  f() {
    return true;
  }
}
```

属性存取器视同属性。

```tsx
class MyClass {
  [s:string]: boolean;

  get isInstance() {
    return true;
  }
}
```

上面示例中，属性`inInstance`的读取器虽然是一个函数方法，但是视同属性，所以属性索引虽然没有涉及方法类型，但是不会报错。

### 2. 类的 interface 接口

interface 接口或 type 别名，可以用对象的形式，为 class 指定一组检查条件。然后，类使用 implements 关键字，表示当前类满足这些外部类型条件的限制。

```tsx
interface Country {
  name:string;
  capital:string;
}
// 或者
type Country = {
  name:string;
  capital:string;
}

class MyCountry implements Country {
  name = '';
  capital = '';
}
```

TypeScript 不允许两个同名的类，但是如果一个类和一个接口同名，那么接口会被合并进类。

```tsx
class A {
  x:number = 1;
}

interface A {
  y:number;
}

let a = new A();
a.y = 10;

a.x // 1
a.y // 10
```

上面示例中，类`A`与接口`A`同名，后者会被合并进前者的类型定义。

### 3. 结构类型原则

Class 也遵循“结构类型原则”。一个对象只要满足 Class 的实例结构，就跟该 Class 属于同一个类型。

```tsx
class Person {
  name: string;
}

class Customer {
  name: string;
}

// 正确
const cust:Customer = new Person();
```

上面示例中，`Person`和`Customer`是两个结构相同的类，TypeScript 将它们视为相同类型，因此`Person`可以用在类型为`Customer`的场合。

对于那些只设置了类型、没有初值的顶层属性，有一个细节需要注意。

```tsx
interface Animal {
  animalStuff: any;
}
interface Dog extends Animal {
  dogStuff: Any
}

class AnimalHouse {
  resident: Animal;
  constructor(animal:Animal) {
    this.resident = animal;
  }
}

class DogHouse extends AnimalHouse {
  resident: Dog;

  constructor(dog:Dog) {
    super(dog);
  }
}
```

上面示例中，类`DogHouse`的顶层成员`resident`只设置了类型（`Dog`），没有设置初值。这段代码在不同的编译设置下，编译结果不一样。

如果编译设置的`target`设成大于等于`ES2022`，或者`useDefineForClassFields`设成`true`，那么下面代码的执行结果是不一样的。

```tsx
const dog = {
  animalStuff: 'animal',
  dogStuff: 'dog'
};

const dogHouse = new DogHouse(dog);

console.log(dogHouse.resident) // undefined
```

解决方法就是使用`declare`命令，去声明顶层成员的类型，告诉 TypeScript 这些成员的赋值由基类实现。

```tsx
class DogHouse extends AnimalHouse {
  declare resident: Dog;

  constructor(dog:Dog) {
    super(dog);
  }
}
```

上面示例中，`resident`属性的类型声明前面用了`declare`命令，这样就能确保在编译目标大于等于`ES2022`时（或者打开`useDefineForClassFields`时），代码行为正确。

### 4. 实例属性的简写形式

实际开发中，很多实例属性的值，是通过构造方法传入的。

```tsx
class Point {
  x:number;
  y:number;

  constructor(x:number, y:number) {
    this.x = x;
    this.y = y;
  }
}
```

上面实例中，属性`x`和`y`的值是通过构造方法的参数传入的。

这样的写法等于对同一个属性要声明两次类型，一次在类的头部，另一次在构造方法的参数里面。这有些累赘，TypeScript 就提供了一种简写形式。

```tsx
class Point {
  constructor(
    public x:number,
    public y:number
  ) {}
}

const p = new Point(10, 10);
p.x // 10
p.y // 10
```

上面示例中，构造方法的参数`x`前面有`public`修饰符，这时 TypeScript 就会自动声明一个公开属性`x`，不必在构造方法里面写任何代码，同时还会设置`x`的值为构造方法的参数值。注意，这里的`public`不能省略。

除了`public`修饰符，构造方法的参数名只要有`private`、`protected`、`readonly`修饰符，都会自动声明对应修饰符的实例属性。

```tsx
class A {
  constructor(
    public a: number,
    protected b: number,
    private c: number,
    readonly d: number
  ) {}
}

// 编译结果
class A {
    a;
    b;
    c;
    d;
    constructor(a, b, c, d) {
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
    }
}
```

上面示例中，从编译结果可以看到，构造方法的`a`、`b`、`c`、`d`会生成对应的实例属性。

`readonly`还可以与其他三个可访问性修饰符，一起使用。

```tsx
class A {
  constructor(
    public readonly x:number,
    protected readonly y:number,
    private readonly z:number
  ) {}
}
```

### 5. 静态成员

类的内部可以使用`static`关键字，定义静态成员。

静态成员是只能通过类本身使用的成员，不能通过实例对象使用。

```tsx
class MyClass {
  static x = 0;
  static printX() {
    console.log(MyClass.x);
  }
}

MyClass.x // 0
MyClass.printX() // 0
```

上面示例中，`x`是静态属性，`printX()`是静态方法。它们都必须通过`MyClass`获取，而不能通过实例对象调用。

`static`关键字前面可以使用 public、private、protected 修饰符。

```tsx
class MyClass {
  private static x = 0;
}

MyClass.x // 报错
```

上面示例中，静态属性`x`前面有`private`修饰符，表示只能在`MyClass`内部使用，如果在外部调用这个属性就会报错。

静态私有属性也可以用 ES6 语法的`#`前缀表示，上面示例可以改写如下。

```tsx
class MyClass {
  static #x = 0;
}
```

注意，静态成员不能使用泛型的类型参数。

```tsx
class Box<Type> {
  static defaultContents: Type; // 报错
}
```

### 6.抽象类，抽象成员

TypeScript 允许在类的定义前面，加上关键字`abstract`，表示该类不能被实例化，只能当作其他类的模板。这种类就叫做“抽象类”（abstract class）。

```tsx
abstract class A {
  id = 1;
}

const a = new A(); // 报错
```

上面示例中，直接新建抽象类的实例，会报错。

抽象类只能当作基类使用，用来在它的基础上定义子类。

```tsx
abstract class A {
  id = 1;
}

class B extends A {
  amount = 100;
}

const b = new B();

b.id // 1
b.amount // 100
```

抽象类的子类也可以是抽象类，也就是说，抽象类可以继承其他抽象类。

```tsx
abstract class A {
  foo:number;
}

abstract class B extends A {
  bar:string;
}
```

抽象类的内部可以有已经实现好的属性和方法，也可以有还未实现的属性和方法。后者就叫做“抽象成员”（abstract member），即属性名和方法名有`abstract`关键字，表示该方法需要子类实现。如果子类没有实现抽象成员，就会报错。

```tsx
abstract class A {
  abstract foo:string;
  bar:string = '';
}

class B extends A {
  foo = 'b';
}
```

上面示例中，抽象类`A`定义了抽象属性`foo`，子类`B`必须实现这个属性，否则会报错。

下面是抽象方法的例子。如果抽象类的方法前面加上`abstract`，就表明子类必须给出该方法的实现。

```tsx
abstract class A {
  abstract execute():string;
}

class B extends A {
  execute() {
    return `B executed`;
  }
}
```

这里有几个注意点。

（1）抽象成员只能存在于抽象类，不能存在于普通类。

（2）抽象成员不能有具体实现的代码。也就是说，已经实现好的成员前面不能加`abstract`关键字。

（3）抽象成员前也不能有`private`修饰符，否则无法在子类中实现该成员。

（4）一个子类最多只能继承一个抽象类。

总之，抽象类的作用是，确保各种相关的子类都拥有跟基类相同的接口，可以看作是模板。其中的抽象成员都是必须由子类实现的成员，非抽象成员则表示基类已经实现的、由所有子类共享的成员。

### 7. this 问题

类的方法经常用到`this`关键字，它表示该方法当前所在的对象。

```tsx
class A {
  name = 'A';

  getName() {
    return this.name;
  }
}

const a = new A();
a.getName() // 'A'

const b = {
  name: 'b',
  getName: a.getName
};
b.getName() // 'b'
```

上面示例中，变量`a`和`b`的`getName()`是同一个方法，但是执行结果不一样，原因就是它们内部的`this`指向不一样的对象。如果`getName()`在变量`a`上运行，`this`指向`a`；如果在`b`上运行，`this`指向`b`。

关于 b 的理解为下方代码

```tsx
const b = {
  name: 'b',
  getName: a.getName
};
等同于
const b = {
  name: 'b',
  getName: () => {
    return this.name;
  }
};
b.getName() // 'b'
```

有些场合需要给出`this`类型，但是 JavaScript 函数通常不带有`this`参数，这时 TypeScript 允许函数增加一个名为`this`的参数，放在参数列表的第一位，用来描述函数内部的`this`关键字的类型。

```tsx
// 编译前
function fn(
  this: SomeType,
  x: number
) {
  /* ... */
}

// 编译后
function fn(x) {
  /* ... */
}
```

上面示例中，函数`fn()`的第一个参数是`this`，用来声明函数内部的`this`的类型。编译时，TypeScript 一旦发现函数的第一个参数名为`this`，则会去除这个参数，即编译结果不会带有该参数。

```tsx
class A {
  name = 'A';

  getName(this: A) {
    return this.name;
  }
}

const a = new A();
const b = a.getName;

b() // 报错
```

上面示例中，类`A`的`getName()`添加了`this`参数，如果直接调用这个方法，`this`的类型就会跟声明的类型不一致，从而报错。

上述理解：

```jsx
b() // 报错 
此时 b 是一个函数
function getName(this: A) {
    return this.name;
}
直接调用 b() 此时参数类型为 void 因为 b 没有调用类型
需要将 b 绑定一个 类型为 A 的调用者
const bb = b.bind(a)
console.log(bb())
这时 bb() 调用 this 为 a 类型是 A
```

`this`参数的类型可以声明为各种对象。

```tsx
function foo(
  this: { name: string }
) {
  this.name = 'Jack';
  this.name = 0; // 报错
}

foo.call({ name: 123 }); // 报错
```

上面示例中，参数`this`的类型是一个带有`name`属性的对象，不符合这个条件的`this`都会报错。

TypeScript 提供了一个`noImplicitThis`编译选项。如果打开了这个设置项，如果`this`的值推断为`any`类型，就会报错。

```tsx
// noImplicitThis 打开

class Rectangle {
  constructor(
    public width:number,
    public height:number
  ) {}

  getAreaFunction() {
    return function () {
      return this.width * this.height; // 报错
    };
  }
}
```

上面示例中，`getAreaFunction()`方法返回一个函数，这个函数里面用到了`this`，但是这个`this`跟`Rectangle`这个类没关系，它的类型推断为`any`，所以就报错了。

在类的内部，`this`本身也可以当作类型使用，表示当前类的实例对象。

```tsx
class Box {
  contents:string = '';

  set(value:string):this {
    this.contents = value;
    return this;
  }
}
```

上面示例中，`set()`方法的返回值类型就是`this`，表示当前的实例对象。

注意，`this`类型不允许应用于静态成员。

```tsx
class A {
  static a:this; // 报错
}
```

上面示例中，静态属性`a`的返回值类型是`this`，就报错了。原因是`this`类型表示实例对象，但是静态成员拿不到实例对象。

有些方法返回一个布尔值，表示当前的`this`是否属于某种类型。这时，这些方法的返回值类型可以写成`this is Type`的形式，其中用到了`is`运算符。

```tsx
class FileSystemObject {
  isFile(): this is FileRep {
    return this instanceof FileRep;
  }

  isDirectory(): this is Directory {
    return this instanceof Directory;
  }

  // ...
}
```

## 泛型

### 1.简介

有些时候，函数返回值的类型与参数类型是相关的。

```tsx
function getFirst(arr) {
  return arr[0];
}
```

上面示例中，函数`getFirst()`总是返回参数数组的第一个成员。参数数组是什么类型，返回值就是什么类型。

这个函数的类型声明只能写成下面这样。

```tsx
function f(arr:any[]):any {
  return arr[0];
}
```

上面的类型声明，就反映不出参数与返回值之间的类型关系。

为了解决这个问题，TypeScript 就引入了“泛型”（generics）。泛型的特点就是带有“类型参数”（type parameter）。

```tsx
function getFirst<T>(arr:T[]):T {
  return arr[0];
}
```

上面示例中，函数`getFirst()`的函数名后面尖括号的部分`<T>`，就是类型参数，参数要放在一对尖括号（`<>`）里面。本例只有一个类型参数`T`，可以将其理解为类型声明需要的变量，需要在调用时传入具体的参数类型。

上例的函数`getFirst()`的参数类型是`T[]`，返回值类型是`T`，就清楚地表示了两者之间的关系。比如，输入的参数类型是`number[]`，那么 T 的值就是`number`，因此返回值类型也是`number`。

函数调用时，需要提供类型参数。

```tsx
getFirst<number>([1, 2, 3])
```

上面示例中，调用函数`getFirst()`时，需要在函数名后面使用尖括号，给出类型参数`T`的值，本例是`<number>`。

不过为了方便，函数调用时，往往省略不写类型参数的值，让 TypeScript 自己推断。

```tsx
getFirst([1, 2, 3])
```

上面示例中，TypeScript 会从实际参数`[1, 2, 3]`，推断出类型参数 T 的值为`number`。

类型参数的名字，可以随便取，但是必须为合法的标识符。习惯上，类型参数的第一个字符往往采用大写字母。一般会使用`T`（type 的第一个字母）作为类型参数的名字。如果有多个类型参数，则使用 T 后面的 U、V 等字母命名，各个参数之间使用逗号（“,”）分隔。

下面是多个类型参数的例子。

```tsx
function map<T, U>(
  arr:T[],
  f:(arg:T) => U
):U[] {
  return arr.map(f);
}

// 用法实例
map<string, number>(
  ['1', '2', '3'],
  (n) => parseInt(n)
); // 返回 [1, 2, 3]
```

上面示例将数组的实例方法`map()`改写成全局函数，它有两个类型参数`T`和`U`。含义是，原始数组的类型为`T[]`，对该数组的每个成员执行一个处理函数`f`，将类型`T`转成类型`U`，那么就会得到一个类型为`U[]`的数组。

总之，泛型可以理解成一段类型逻辑，需要类型参数来表达。有了类型参数以后，可以在输入类型与输出类型之间，建立一一对应关系。

### 2.泛型的写法

#### 2.1 函数的泛型写法

```tsx
function id<T>(arg:T):T {
  return arg;
}
```

那么对于变量形式定义的函数，泛型有下面两种写法。

```tsx
// 写法一
let myId:<T>(arg:T) => T = id;

// 写法二
let myId:{ <T>(arg:T): T } = id;  
      
// 理解 let instanceType: Type = instanceType
// 写法一
type AT = <T>(arg:T) => T;
let myId:AT = id; 
// 写法二 解构函数 详见 文档 https://wangdoc.com/typescript/function
type AT = { <T>(arg:T): T } ;
let myId:AT = id;  
```

#### 2.2 接口的泛型写法

```tsx
interface Comparator<T> {
  compareTo(value:T): number;
}

class Rectangle implements Comparator<Rectangle> {

  compareTo(value:Rectangle): number {
    // ...
  }
}
```

上面示例中，先定义了一个泛型接口，然后将这个接口用于一个类。

实例：可以对不同的类型 用不同的实现 更加清晰每个类型处理

#### 2.3 类的泛型写法

```tsx
class C<NumType> {
  value!: NumType;
  add!: (x: NumType, y: NumType) => NumType;
}

let foo = new C<number>();

foo.value = 0;
foo.add = function (x, y) {
  return x + y;
};
```

#### 2.4 类型别名的泛型写法

type 命令定义的类型别名，也可以使用泛型。

```tsx
type Nullable<T> = T | undefined | null;
```

上面示例中，`Nullable<T>`是一个泛型，只要传入一个类型，就可以得到这个类型与`undefined`和`null`的一个联合类型。

下面是另一个例子。

```tsx
type Container<T> = { value: T };

const a: Container<number> = { value: 0 };
const b: Container<string> = { value: 'b' };
```

下面是定义树形结构的例子。

```tsx
type Tree<T> = {
  value: T;
  left: Tree<T> | null;
  right: Tree<T> | null;
};
```

上面示例中，类型别名`Tree`内部递归引用了`Tree`自身。

### 3. 类型参数的默认值

类型参数可以设置默认值。使用时，如果没有给出类型参数的值，就会使用默认值。

```tsx
function getFirst<T = string>(
  arr:T[]
):T {
  return arr[0];
}
```

上面示例中，`T = string`表示类型参数的默认值是`string`。调用`getFirst()`时，如果不给出`T`的值，TypeScript 就认为`T`等于`string`。

但是，因为 TypeScript 会从实际参数推断出`T`的值，从而覆盖掉默认值，所以下面的代码不会报错。

```tsx
getFirst([1, 2, 3]) // 正确
```

上面示例中，实际参数是`[1, 2, 3]`，TypeScript 推断 T 等于`number`，从而覆盖掉默认值`string`。

类型参数的默认值，往往用在类中。

```tsx
class Generic<T = string> {
  list:T[] = []

  add(t:T) {
    this.list.push(t)
  }
}
```

上面示例中，类`Generic`有一个类型参数`T`，默认值为`string`。这意味着，属性`list`默认是一个字符串数组，方法`add()`的默认参数是一个字符串。

```tsx
const g = new Generic();

g.add(4) // 报错
g.add('hello') // 正确
```

上面示例中，新建`Generic`的实例`g`时，没有给出类型参数`T`的值，所以`T`就等于`string`。因此，向`add()`方法传入一个数值会报错，传入字符串就不会。

```tsx
const g = new Generic<number>();

g.add(4) // 正确
g.add('hello') // 报错
```

上面示例中，新建实例`g`时，给出了类型参数`T`的值是`number`，因此`add()`方法传入数值不会报错，传入字符串会报错。

一旦类型参数有默认值，就表示它是可选参数。如果有多个类型参数，可选参数必须在必选参数之后。

```tsx
<T = boolean, U> // 错误

<T, U = boolean> // 正确
```

上面示例中，依次有两个类型参数`T`和`U`。如果`T`是可选参数，`U`不是，就会报错。

### 4. 类型参数的约束条件

很多类型参数并不是无限制的，对于传入的类型存在约束条件。

```tsx
function comp<Type>(a:Type, b:Type) {
  if (a.length >= b.length) {
    return a;
  }
  return b;
}
```

上面示例中，类型参数 Type 有一个隐藏的约束条件：它必须存在`length`属性。如果不满足这个条件，就会报错。

TypeScript 提供了一种语法，允许在类型参数上面写明约束条件，如果不满足条件，编译时就会报错。这样也可以有良好的语义，对类型参数进行说明。

```tsx
function comp<T extends { length: number }>(
  a: T,
  b: T
) {
  if (a.length >= b.length) {
    return a;
  }
  return b;
}
```

上面示例中，`T extends { length: number }`就是约束条件，表示类型参数 T 必须满足`{ length: number }`，否则就会报错。

```tsx
comp([1, 2], [1, 2, 3]) // 正确
comp('ab', 'abc') // 正确
comp(1, 2) // 报错
```

上面示例中，只要传入的参数类型不满足约束条件，就会报错。

类型参数的约束条件采用下面的形式。

```tsx
<TypeParameter extends ConstraintType>
```

上面语法中，`TypeParameter`表示类型参数，`extends`是关键字，这是必须的，`ConstraintType`表示类型参数要满足的条件，即类型参数应该是`ConstraintType`的子类型。

类型参数可以同时设置约束条件和默认值，前提是默认值必须满足约束条件。

```tsx
type Fn<A extends string, B extends string = 'world'>
  =  [A, B];

type Result = Fn<'hello'> // ["hello", "world"]
```

### 5.泛型可以嵌套。

类型参数可以是另一个泛型。

```tsx
type OrNull<Type> = Type|null;

type OneOrMany<Type> = Type|Type[];

type OneOrManyOrNull<Type> = OrNull<OneOrMany<Type>>;
```

上面示例中，最后一行的泛型`OrNull`的类型参数，就是另一个泛型`OneOrMany`。

## 类型断言

### 1. 类型断言有两种语法。

```tsx
// 语法一：<类型>值
<Type>value

// 语法二：值 as 类型
value as Type
```

上面两种语法是等价的，`value`表示值，`Type`表示类型。早期只有语法一，后来因为 TypeScript 开始支持 React 的 JSX 语法（尖括号表示 HTML 元素），为了避免两者冲突，就引入了语法二。目前，推荐使用语法二。

```tsx
// 语法一
let bar:T = <T>foo;

// 语法二
let bar:T = foo as T;
```

上面示例是两种类型断言的语法，其中的语法一因为跟 JSX 语法冲突，使用时必须关闭 TypeScript 的 React 支持，否则会无法识别。由于这个原因，现在一般都使用语法二。

### 2.类型断言的条件

```tsx
const n = 1;
const m:string = n as string; // 报错
```

类型断言要求实际的类型与断言的类型兼容，实际类型可以断言为一个更加宽泛的类型（父类型），也可以断言为一个更加精确的类型（子类型），但不能断言为一个完全无关的类型。

但是，如果真的要断言成一个完全无关的类型，也是可以做到的。

```tsx
// 或者写成 <T><unknown>expr
expr as unknown as T
```

上面代码中，`expr`连续进行了两次类型断言，第一次断言为`unknown`类型，第二次断言为`T`类型。这样的话，`expr`就可以断言成任意类型`T`，而不报错。

下面是本小节开头那个例子的改写。

```tsx
const n = 1;
const m:string = n as unknown as string; // 正确
```

### 3. as const 断言

如果没有声明变量类型，let 命令声明的变量，会被类型推断为 TypeScript 内置的基本类型之一；const 命令声明的变量，则被推断为值类型常量。

```tsx
// 类型推断为基本类型 string
let s1 = 'JavaScript';

// 类型推断为字符串 “JavaScript”
const s2 = 'JavaScript';
```

上面示例中，变量`s1`的类型被推断为`string`，变量`s2`的类型推断为值类型`JavaScript`。后者是前者的子类型，相当于 const 命令有更强的限定作用，可以缩小变量的类型范围。

有些时候，let 变量会出现一些意想不到的报错，变更成 const 变量就能消除报错。

```tsx
let s = 'JavaScript';

type Lang =
  |'JavaScript'
  |'TypeScript'
  |'Python';

function setLang(language:Lang) {
  /* ... */
}

setLang(s); // 报错
```

上面示例中，最后一行报错，原因是函数`setLang()`的参数`language`类型是`Lang`，这是一个联合类型。但是，传入的字符串`s`的类型被推断为`string`，属于`Lang`的父类型。父类型不能替代子类型，导致报错。

一种解决方法就是把 let 命令改成 const 命令。

```tsx
const s = 'JavaScript';
```

这样的话，变量`s`的类型就是值类型`JavaScript`，它是联合类型`Lang`的子类型，传入函数`setLang()`就不会报错。

另一种解决方法是使用类型断言。TypeScript 提供了一种特殊的类型断言`as const`，用于告诉编译器，推断类型时，可以将这个值推断为常量，即把 let 变量断言为 const 变量，从而把内置的基本类型变更为值类型。

```tsx
let s = 'JavaScript' as const;
setLang(s);  // 正确
```

上面示例中，变量`s`虽然是用 let 命令声明的，但是使用了`as const`断言以后，就等同于是用 const 命令声明的，变量`s`的类型会被推断为值类型`JavaScript`。

使用了`as const`断言以后，let 变量就不能再改变值了。

```tsx
let s = 'JavaScript' as const;
s = 'Python'; // 报错
```

上面示例中，let 命令声明的变量`s`，使用`as const`断言以后，就不能改变值了，否则报错。

注意，`as const`断言只能用于字面量，不能用于变量。

```tsx
let s = 'JavaScript';
setLang(s as const); // 报错
```

上面示例中，`as const`断言用于变量`s`，就报错了。下面的写法可以更清晰地看出这一点。

```tsx
let s1 = 'JavaScript';
let s2 = s1 as const; // 报错
```

另外，`as const`也不能用于表达式。

```tsx
let s = ('Java' + 'Script') as const; // 报错
```

上面示例中，`as const`用于表达式，导致报错。

`as const`也可以写成前置的形式。

```tsx
// 后置形式
expr as const

// 前置形式
<const>expr
```

`as const`断言可以用于整个对象，也可以用于对象的单个属性，这时它的类型缩小效果是不一样的。

```tsx
const v1 = {
  x: 1,
  y: 2,
}; // 类型是 { x: number; y: number; }

const v2 = {
  x: 1 as const,
  y: 2,
}; // 类型是 { x: 1; y: number; }

const v3 = {
  x: 1,
  y: 2,
} as const; // 类型是 { readonly x: 1; readonly y: 2; }
```

上面示例中，第二种写法是对属性`x`缩小类型，第三种写法是对整个对象缩小类型。

总之，`as const`会将字面量的类型断言为不可变类型，缩小成 TypeScript 允许的最小类型。

下面是数组的例子。

```tsx
// a1 的类型推断为 number[]
const a1 = [1, 2, 3];

// a2 的类型推断为 readonly [1, 2, 3]
const a2 = [1, 2, 3] as const;
```

上面示例中，数组字面量使用`as const`断言后，类型推断就变成了只读元组。

由于`as const`会将数组变成只读元组，所以很适合用于函数的 rest 参数。

```tsx
function add(x:number, y:number) {
  return x + y;
}

const nums = [1, 2];
const total = add(...nums); // 报错
```

上面示例中，变量`nums`的类型推断为`number[]`，导致使用扩展运算符`...`传入函数`add()`会报错，因为`add()`只能接受两个参数，而`...nums`并不能保证参数的个数。

事实上，对于固定参数个数的函数，如果传入的参数包含扩展运算符，那么扩展运算符只能用于元组。只有当函数定义使用了 rest 参数，扩展运算符才能用于数组。

解决方法就是使用`as const`断言，将数组变成元组。

```tsx
const nums = [1, 2] as const;
const total = add(...nums); // 正确
```

上面示例中，使用`as const`断言后，变量`nums`的类型会被推断为`readonly [1, 2]`，使用扩展运算符展开后，正好符合函数`add()`的参数类型。

Enum 成员也可以使用`as const`断言。

```tsx
enum Foo {
  X,
  Y,
}
let e1 = Foo.X;            // Foo
let e2 = Foo.X as const;   // Foo.X
```

上面示例中，如果不使用`as const`断言，变量`e1`的类型被推断为整个 Enum 类型；使用了`as const`断言以后，变量`e2`的类型被推断为 Enum 的某个成员，这意味着它不能变更为其他成员。 

### 4.非空断言
空断言只有在打开编译选项`strictNullChecks`时才有意义。如果不打开这个选项，编译器就不会检查某个变量是否可能为`undefined`或`null`。

？可选 ！必须。 如果！强制解包错误会报错。

## 模块

### 1. 简介

任何包含 import 或 export 语句的文件，就是一个模块（module）。相应地，如果文件不包含 export 语句，就是一个全局的脚本文件。

模块本身就是一个作用域，不属于全局作用域。模块内部的变量、函数、类只在内部可见，对于模块外部是不可见的。暴露给外部的接口，必须用 export 命令声明；如果其他文件要使用模块的接口，必须用 import 命令来输入。

如果一个文件不包含 export 语句，但是希望把它当作一个模块（即内部变量对外不可见），可以在脚本头部添加一行语句。

```tsx
export {};
```

上面这行语句不产生任何实际作用，但会让当前文件被当作模块处理，所有它的代码都变成了内部代码。

### 2. import type 语句

import 在一条语句中，可以同时输入类型和正常接口。

```tsx
// a.ts
export interface A {
  foo: string;
}

export let a = 123;

// b.ts
import { A, a } from './a';
```

上面示例中，文件`a.ts`的 export 语句输出了一个类型`A`和一个正常接口`a`，另一个文件`b.ts`则在同一条语句中输入了类型和正常接口。

这样很不利于区分类型和正常接口，容易造成混淆。为了解决这个问题，TypeScript 引入了两个解决方法。

第一个方法是在 import 语句输入的类型前面加上`type`关键字。

```tsx
import { type A, a } from './a';
```

上面示例中，import 语句输入的类型`A`前面有`type`关键字，表示这是一个类型。

第二个方法是使用 import type 语句，这个语句只能输入类型，不能输入正常接口。

```tsx
// 正确
import type { A } from './a';

// 报错
import type { a } from './a';
```

import type 语句也可以输入默认类型。

```tsx
import type DefaultType from 'moduleA';
```

import type 在一个名称空间下，输入所有类型的写法如下。

```tsx
import type * as TypeNS from 'moduleA';
```

同样的，export 语句也有两种方法，表示输出的是类型。

```tsx
type A = 'a';
type B = 'b';

// 方法一
export {type A, type B};

// 方法二
export type {A, B};
```

上面示例中，方法一是使用`type`关键字作为前缀，表示输出的是类型；方法二是使用 export type 语句，表示整行输出的都是类型。

下面是 export type 将一个类作为类型输出的例子。

```tsx
class Point {
  x: number;
  y: number;
}

export type { Point };
```

上面示例中，由于使用了 export type 语句，输出的并不是 Point 这个类，而是 Point 代表的实例类型。输入时，只能作为类型输入。

```tsx
import type { Point } from './module';

const p:Point = { x: 0, y: 0 };
```

上面示例中，`Point`只能作为类型输入，不能当作正常接口使用。

### 3. 模块定位

模块定位（module resolution）指的是一种算法，用来确定 import 语句和 export 语句里面的模块文件位置。

```tsx
// 相对模块
import { TypeA } from './a';

// 非相对模块
import * as $ from "jquery";
```

上面示例中，TypeScript 怎么确定`./a`或`jquery`到底是指哪一个模块，具体位置在哪里，用到的算法就叫做“模块定位”。

编译参数`moduleResolution`，用来指定具体使用哪一种定位算法。常用的算法有两种：`Classic`和`Node`。

如果没有指定`moduleResolution`，它的默认值与编译参数`module`有关。`module`设为`commonjs`时（项目脚本采用 CommonJS 模块格式），`moduleResolution`的默认值为`Node`，即采用 Node.js 的模块定位算法。其他情况下（`module`设为 es2015、 esnext、amd, system, umd 等等），就采用`Classic`定位算法。

