---
title: 重构-提炼函数
tags: [重构]
categories: [重构]
banner_img: /img/bg/home.webp
date: 2023-09-24 01:14:00
excerpt: Extract Method
hide: false # 
sticky: 1 # 排序值
---
![extract-function](/img/refactor/extract-function.png)

个人喜欢的原文精句：

1. “将意图与实现分开”：如果你需要花时间浏览一段代码才能弄清它到底在干什么，那么就应该将其提炼到一个函数中，并根据它所做的事为其命名
2. 一眼就能看到函数的用途，大多数时候根本不需要关心函数如何达成其用途(这是函数体内干的事)。
3. 函数名的长度不重要（BTW：别用缩写！）
4. 提炼的关键就在于命名，随着理解的加深，我经常需要改名。

# 时机

- 当我们觉得一段大函数内的某一部分是在做同一件事，并且自成体系并且不与其它掺和时
- 当代码展示的意图和真正想做的事情不是同一件时

# 做法

- 创造一个新函数，以它“做什么”来命名
- 将待提炼的代码从复制到新函数中
- 检查函数内代码的作用域,变量
- 编译 测试
- 查看其他代码是否有可提炼之处

# Demo

## 1. 无局部变量

```javascript
function printOwing(invoice) {
    let outstanding = 0;

    console.log("***********************");
    console.log("**** Customer Owes ****");
    console.log("***********************");

    // calculate outstanding
    for (const o of invoice.orders) {
    　outstanding += o.amount;
    }

    // record due date
    const today = Clock.today;
    invoice.dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

    //print details
    console.log(`name: ${invoice.customer}`);
    console.log(`amount: ${outstanding}`);
    console.log(`due: ${invoice.dueDate.toLocaleDateString()}`);
}	
```

提炼为

```javascript
function printOwing(invoice) {
　let outstanding = 0;

　printBanner();

　// calculate outstanding
　for (const o of invoice.orders) {
　　outstanding += o.amount;
　}

　// record due date
　const today = Clock.today;
　invoice.dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

　printDetails();

　function printDetails() { 
　　console.log(`name: ${invoice.customer}`); 
　　console.log(`amount: ${outstanding}`);
　　console.log(`due: ${invoice.dueDate.toLocaleDateString()}`);
  }
}

function printBanner() {
　console.log("***********************");
　console.log("**** Customer Owes ****");
　console.log("***********************");
}
```

## 2. 有局部变量

```javascript
function printOwing(invoice) {
　let outstanding = 0;

　printBanner();

　// calculate outstanding
　for (const o of invoice.orders) {
　　outstanding += o.amount;
　}

　// record due date
　const today = Clock.today;
　invoice.dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

　printDetails(invoice, outstanding);
}
function printDetails(invoice, outstanding) {
　console.log(`name: ${invoice.customer}`);
　console.log(`amount: ${outstanding}`);
　console.log(`due: ${invoice.dueDate.toLocaleDateString()}`);
}
```

继续提炼日期

```javascript
function printOwing(invoice) {
　let outstanding = 0;
  
　printBanner();
  
　// calculate outstanding
　for (const o of invoice.orders) {
　　outstanding += o.amount;
　}
  
　recordDueDate(invoice);
  
　printDetails(invoice, outstanding);
}
function recordDueDate(invoice) {
　const today = Clock.today;
　invoice.dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
}
```

## 3. 对局部变量再赋值

```javascript
function printOwing(invoice) {
　printBanner();
　const outstanding = calculateOutstanding(invoice);
　recordDueDate(invoice);
　printDetails(invoice, outstanding);
}
function calculateOutstanding(invoice) {
　let result = 0;
　for (const o of invoice.orders) {
　　result += o.amount;
　}
　return result;
}
```



