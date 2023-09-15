---
title: 读重构 - 第一个示例
tags: [重构]
categories: [重构]
banner_img: /img/bg/home.webp
date: 2023-09-13 19:03:00
excerpt: 阅读一下重构的书籍 懂的什么是好代码 才能写出好代码
hide: false # 
sticky: 1 # 排序值
comment: true
---

> 谈原理，很容易流于泛泛，又很难说明如何实际应用。给出一个示例，就可以帮助我把事情认识清楚。

作者一下就点出了只看原理的困境，读很多原理的文章时，当时有一种我懂了的感觉，但是又想不出它应该用在哪里, 实际遇到相似原理的时候又有一种之前只是略懂的感觉。

先给例子 在讲原理 加上一些拓展 可能认知会更清晰。

## 1 起点

例子：

设想有一个戏剧演出团，演员们经常要去各种场合表演戏剧。通常客户 (customer)会指定几出剧目，而剧团则根据观众(audience)人数及剧目类型来向客户收费。该团目前出演两种戏剧: 悲剧(tragedy)和喜剧(comedy)。给客 户发出账单时，剧团还会根据到场观众的数量给出“观众量积分”(volume credit)优惠，下次客户再请剧团表演时可以使用积分获得折扣——你可以把它看 作一种提升客户忠诚度的方式。

plays.json 该剧团将剧目的数据存储在一个简单的JSON文件中。

```json
{
    "hamlet": {"name": "Hamlet", "type": "tragedy"},
    "as-like": {"name": "As You Like It", "type": "comedy"},
    "othello": {"name": "Othello", "type": "tragedy"}
}
```

invoices.json 他们开出的账单也存储在一个JSON文件里。

```json
{
    "customer": "BigCo",
    "performances": [
        {
            "playID": "hamlet",
            "audience": 55
        },
        {
            "playID": "as-like",
            "audience": 35
        },
        {
            "playID": "othello",
            "audience": 40
        }
    ]
}
```
打印账单详情
```js
function statement (invoice, plays) {
    let totalAmount = 0;
    let volumeCredits = 0;
    let result = `Statement for ${invoice.customer}\n`;
    const format = new Intl.NumberFormat("en-US",
                          { style: "currency", currency: "USD",
                            minimumFractionDigits: 2 }).format;
    for (let perf of invoice.performances) {
      const play = plays[perf.playID];
      let thisAmount = 0;
      switch (play.type) {
      case "tragedy":
        thisAmount = 40000;
        if (perf.audience > 30) {
          thisAmount += 1000 * (perf.audience - 30);
        }
        break;
      case "comedy":
        thisAmount = 30000;
        if (perf.audience > 20) {
          thisAmount += 10000 + 500 * (perf.audience - 20);
        }
        thisAmount += 300 * perf.audience;
        break;
      default:
          throw new Error(`unknown type: ${play.type}`);
      }
      // add volume credits
      volumeCredits += Math.max(perf.audience - 30, 0);
      // add extra credit for every ten comedy attendees
      if ("comedy" === play.type) volumeCredits += Math.floor(perf.audience / 5);
      // print line for this order
      result += ` ${play.name}: ${format(thisAmount/100)} (${perf.audience} seats)\n`;
      totalAmount += thisAmount;
    }
    result += `Amount owed is ${format(totalAmount/100)}\n`;
    result += `You earned ${volumeCredits} credits\n`;
    return result;
}
```

打印结果

```json
Statement for BigCo
 Hamlet: $650.00 (55 seats)
 As You Like It: $580.00 (35 seats)
 Othello: $500.00 (40 seats)
Amount owed is $1,730.00
You earned 47 credits
```

评价:

代码组织不甚清晰!  

可拓展性不高！

## 2 重构第一步 - 测试驱动开发

> 重构前，先检查自己是否有一套可靠的测试集。这些测试必须有自我检验能力。

**进行重构时，需要依赖测试**。
测试可以看做 bug 检测器，它们能保护不被自己犯的错误所困扰。
把想要达成的目标写两遍——代码里写一遍，测试里 再写一遍、这样犯两遍同样的错误才能骗过检测器。
这大大降低了错误率，因为对工作进行了二次确认。尽管编写测试需要花费时间，但却为节省下可观的调试时间。

## 3 分解 statement 函数

> 傻瓜都能写出计算机可以理解的代码。唯有能写出人类容易理解的代码的，才是优秀的程序员。

首先要明确的是一段好的代码，**一眼望过去我就该知道它在做什么**，回头看时，**我不需要重新思考一遍**。

### 3.1 抽离函数

最让人难懂的逻辑就是 switch 中计算金额的逻辑。要将他抽离出去，

如何抽离呢？

先将这块代码抽取成一个独立的函数，按它所干的事情给它命名，比如叫 amountFor(performance)，

如何将这块代码提炼到自己的一个函数里？

**首先要判断有哪些变量会离开原本的作用域**，在此示例中，是 perf、play 和 thisAmount 这3个变量。前两个变量会被提炼后的函数使用，但不会被修改，那么我就可以将它们以参数方式传递进来。
**要更关心那些会被修改的变量**。这里只有唯一一个 ——thisAmount，<u>因此可以将它从函数中直接返回，我还可以将其初始化放到提炼后的函数里</u>。
修改后的代码如下所示。

```js
function statement (invoice, plays) {
    let totalAmount = 0;
    let volumeCredits = 0;
    let result = `Statement for ${invoice.customer}\n`;
    // 格式化钱
    const format = new Intl.NumberFormat("en-US",
                          { style: "currency", currency: "USD",
                            minimumFractionDigits: 2 }).format;
    for (let perf of invoice.performances) {
      const play = plays[perf.playID];
      let thisAmount = amountFor(perf, play);
      // add volume credits
      volumeCredits += Math.max(perf.audience - 30, 0);
      // add extra credit for every ten comedy attendees
      if ("comedy" === play.type) volumeCredits += Math.floor(perf.audience / 5);
      // print line for this order
      result += ` ${play.name}: ${format(thisAmount/100)} (${perf.audience} seats)\n`;
      totalAmount += thisAmount;
    }
    result += `Amount owed is ${format(totalAmount/100)}\n`;
    result += `You earned ${volumeCredits} credits\n`;
    return result;
}

function amountFor(perf, play) {
  let thisAmount = 0;
  switch (play.type) {
  case "tragedy":
    thisAmount = 40000;
    if (perf.audience > 30) {
      thisAmount += 1000 * (perf.audience - 30);
    }
    break;
  case "comedy":
    thisAmount = 30000;
    if (perf.audience > 20) {
      thisAmount += 10000 + 500 * (perf.audience - 20);
    }
    thisAmount += 300 * perf.audience;
    break;
  default:
      throw new Error(`unknown type: ${play.type}`);
  }
  return thisAmount;
}
```

改写之后要立马进行测试一遍，以确定我们的修改有效而不会带来其他不可预见的问题。如果重构时思如泉涌，写到最后进行测试，可能中间某一个步骤出现了问题就需要把重构的每一步都进行检测，难以查找，有时还会出现重构方向产生偏差，需要对中间以及偏后的代码重新编写。

重构过程的精髓所在:**小步修改，每次修改后就运行测试**。如果我 改动了太多东西，犯错时就可能陷入麻烦的调试，并为此耗费大把时间。小步修改，以及它带来的频繁反馈，正是防止混乱的关键。

> 重构技术就是以微小的步伐修改程序。如果你犯下错误，很容易便可 发现它。

测试通过后，我会将代码推送到 git 上，以便接下来的修改不会影响上一段的代码，下一段重构做的不好以及思绪混乱时，直接切回上次提交极为有用。

### 3.2 修改变量名

> 好代码应能清楚地表明它在做什么，而变量命名是代码清晰的关键

```js
function amountFor(aPerformance, play) {
  let result = 0;
  switch (play.type) {
  case "tragedy":
    result = 40000;
    if (perf.audience > 30) {
      result += 1000 * (perf.audience - 30);
    }
    break;
  case "comedy":
    result = 30000;
    if (perf.audience > 20) {
      result += 10000 + 500 * (perf.audience - 20);
    }
    result += 300 * perf.audience;
    break;
  default:
      throw new Error(`unknown type: ${play.type}`);
  }
  return result;
}
```

作者的风格:

- 永远将函数的返回值命名为“result”，这样我一眼就 能知道它的作用。

  -- 我觉得可以作为一个标准。当然我也觉得写 amount 也没什么错。

- 使用一门动态类型语言(如JavaScript)时，跟踪变量的类型很有意义。因此，我为参数取名时都默认带上其类型名。一般我会使 用不定冠词修饰它，除非命名中另有解释其角色的相关信息。(aPerformance)

  -- iOS 程序员自始至终都是如此 明知道是什么类型写变量名的时候也会带上相关的类型 如：amountNumber 这样阅读起来更顺畅，但是时常也会觉得啰嗦。如果用了 ts 可以不加类型，单纯的 js 最好还是加上相应的类型，毕竟 js 太魔幻了。

  -- 不定冠词（the Indefinite Article），还有一种是零冠词（Zero Article）。不定冠词a (an)与数词one 同源，是"一个"的意思。a用于辅音音素前，一般读作e，而an则用于元音音素前，一般读做an。

### 3.3 移除局部变量

观察 amountFor 函数时，我会看看它的参数都从哪里来，<u>play 变量是由 performance 变量计算得到的，因此根本没必要将它作为参数传入</u>，我可以在 amountFor 函数中重新计算得到它。当我分解一个长函数时，我喜欢将play这样的变量移除掉，<u>因为它们创建了很多具有局部作用域的临时变量，这会使提炼函数更加复杂</u>。这里我要使用的重构手法是**以查询取代临时变量**

```js
function playFor(aPerformance) {
	return plays[aPerformance.playID];
}
```

```js
function statement (invoice, plays) {
  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;
  const format = new Intl.NumberFormat("en-US",
                        { style: "currency", currency: "USD",
                          minimumFractionDigits: 2 }).format;
  for (let perf of invoice.performances) {
    const play = playFor(perf);
    let thisAmount = amountFor(perf, play);
    // add volume credits
    volumeCredits += Math.max(perf.audience - 30, 0);
    // add extra credit for every ten comedy attendees
    if ("comedy" === play.type) volumeCredits += Math.floor(perf.audience / 5);
    // print line for this order
    result += ` ${play.name}: ${format(thisAmount/100)} (${perf.audience} seats)\n`;
    totalAmount += thisAmount;
  }
  result += `Amount owed is ${format(totalAmount/100)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
}
```

编译、测试、最后将参数删除。

```js
function statement (invoice, plays) {
  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;
  const format = new Intl.NumberFormat("en-US",
                        { style: "currency", currency: "USD",
                          minimumFractionDigits: 2 }).format;
  for (let perf of invoice.performances) {
    let thisAmount = amountFor(perf);
    // add volume credits
    volumeCredits += Math.max(perf.audience - 30, 0);
    // add extra credit for every ten comedy attendees
    if ("comedy" === playFor(perf).type) volumeCredits += Math.floor(perf.audience / 5);
    // print line for this order
    result += ` ${playFor(perf).name}: ${format(thisAmount/100)} (${perf.audience} seats)\n`;
    totalAmount += thisAmount;
  }
  result += `Amount owed is ${format(totalAmount/100)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
}
```

这次重构可能在一些程序员心中敲响警钟:重构前，查找play变量的代码在每次循环中只执行了1次，而重构后却执行了3次。我会在后面探讨重构与性能之间的关系，但现在，我认为这次改动还不太可能对性能有严重影响，即便真的有所影响，后续再对一段结构良好的代码进行性能调优，也容易得多。

移除局部变量的好处就是做提炼时会简单得多，因为需要操心的局部作用域
变少了。实际上，在做任何提炼前，我一般都会先移除局部变量。

------

按照之前的方法一次提取观众量积分逻辑

```js
function volumeCreditsFor(aPerformance) {
  let result = 0;
  result += Math.max(aPerformance.audience - 30, 0);
  if ("comedy" === playFor(aPerformance).type) result += Math.floor(aPerformance.audience / 5)
;
  return result;
}
```

```js
function statement (invoice, plays) {
  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;
  const format = new Intl.NumberFormat("en-US",
                        { style: "currency", currency: "USD",
                          minimumFractionDigits: 2 }).format;
  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);
    // print line for this order
    result += ` ${playFor(perf).name}: ${format(amountFor(perf)/100)} (${perf.audience} seats)
\n`;
    totalAmount += amountFor(perf);
  }
  result += `Amount owed is ${format(totalAmount/100)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
}
```
### 3.4 临时变量替换为一个明确声明的函数 - 不是很重要

正如上面所指出的，临时变量往往会带来麻烦。你需要明确的知道变量代表的意思，你会不自觉地阅读 format 后面的实现，这有一种打断了整体阅读的连续感。

它们只在对其进行处理的代码块中有用，因此临时变量实质上是鼓励你写长而复杂的函数。下一步我要替换掉一些临时变量，而最简单的莫过于从format变量入手。**这是典型 的“将函数赋值给临时变量”的场景，我更愿意将其替换为一个明确声明的函数。**

```js
function format(aNumber) {
  return new Intl.NumberFormat("en-US",
                        { style: "currency", currency: "USD",
                          minimumFractionDigits: 2 }).format;
}
```

```js
function statement (invoice, plays) {
  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;
  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);
    // print line for this order
    result += ` ${playFor(perf).name}: ${format(amountFor(perf)/100)} (${perf.audience} seats)
\n`;
    totalAmount += amountFor(perf);
  }
  result += `Amount owed is ${format(totalAmount/100)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
}
```

尽管将函数变量改变成函数声明也是一种重构手法，但我既未为此手法命名，也未将它纳入重构名录。还有很多的重构手法我都觉得没那么重要。我觉得上面这个函数改名的手法既十分简单又不太常用，不值得在重构名录中占有一席之地。

我对提炼得到的函数名称不很满意——format未能清晰地描述其作 用。formatAsUSD很表意，但又太长，特别它仅是小范围地被用在一个字符串模板 中。我认为这里真正需要强调的是，它格式化的是一个货币数字，因此我选取了 一个能体现此意图的命名，并应用了改变函数声明手法。

```js
function usd(aNumber) {
  return new Intl.NumberFormat("en-US",
                        { style: "currency", currency: "USD",
                          minimumFractionDigits: 2 }).format;
}
```

------

移除观众量几分总和

volumeCredits, 处理这个变量很微秒，因为它是在 循环的迭代过程中累加得到的
第一步，就是应用拆分循环将 volumeCredits 的累加过程分离出来

```js
function statement (invoice, plays) {
  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;
  for (let perf of invoice.performances) {
    // print line for this order
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience} seats)\n`;
    totalAmount += amountFor(perf);
  }
  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);
  }
result += `Amount owed is ${usd(totalAmount)}\n`;
result += `You earned ${volumeCredits} credits\n`;
return result;
}
```

完成这一步，就可以可以看出 `volumeCredits` 和提炼出来的 for 循环可以提出函数 如下：

```js
function totalVolumeCredits() {
  let volumeCredits = 0;
  for (let perf of invoice.performances) {
    volumeCredits += volumeCreditsFor(perf);
  }
  return volumeCredits;
}
```

```js
function statement (invoice, plays) {
  let totalAmount = 0;
  let result = `Statement for ${invoice.customer}\n`;
  for (let perf of invoice.performances) {
    // print line for this order
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience} seats)\n`;
    totalAmount += amountFor(perf);
  }
  let volumeCredits = totalVolumeCredits();
  result += `Amount owed is ${usd(totalAmount)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
}
```

写到这里 会产生一些困惑，使用多次 for 循环会不会造成效率上的问题。大多数时候，重复一次这样的循环对性能的影响都可忽略不计。如果你在重构前后进行计时，很可能甚至都注意不到运行速度的变化——通常也确实没什么变化。许多程序员对代码实际的运行路径都所知不足，甚至经验丰富的程序员有时也未能避免。在聪明的编译器、现代的缓存技术面前，我们很多直觉都是不准确的。软件的性能通常只与代码的一小部分相关，改变其他的部分往往对总体性能贡献甚微。

当然，“大多数时候”不等同于“所有时候”。有时，一些重构手法也会显著地影响性能。
但即便如此，我通常也不去管它，继续重构，因为有了一份结构良好的代码，回头调优其性能也容易得多

> 大多数情况可以这么做：如果重构引入了性能损耗，先完成重构，再做性能优化

------

继续移除 totalAmount

```js
function totalAmount() {
   let totalAmount = 0;
   for (let perf of invoice.performances) {
     totalAmount += amountFor(perf);
   }
   return totalAmount;
}
```

```js
function statement (invoice, plays) {
  let result = `Statement for ${invoice.customer}\n`;
  for (let perf of invoice.performances) {
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience} seats)\n`;
  }
  let volumeCredits = totalVolumeCredits();
  result += `Amount owed is ${usd(totalAmount())}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
}
```

## 4 进展：大量的嵌套函数

重构至此，是时候停下来欣赏一下代码的全貌了。

```js
function statement (invoice, plays) {
  let result = `Statement for ${invoice.customer}\n`;
  for (let perf of invoice.performances) {
    result += ` ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience} seats)\n`;
  }
  result += `Amount owed is ${usd(totalAmount())}\n`;
  result += `You earned ${totalVolumeCredits()} credits\n`;
  return result;
  
  function totalAmount() {
    let result = 0;
    for (let perf of invoice.performances) {
      result += amountFor(perf);
    }
    return result;
  }
  
  function totalVolumeCredits() {
    let result = 0;
    for (let perf of invoice.performances) {
      result += volumeCreditsFor(perf);
    }
    return result;
  }
  
  function usd(aNumber) {
    return new Intl.NumberFormat("en-US",
                        { style: "currency", currency: "USD",
                          minimumFractionDigits: 2 }).format(aNumber/100);
  }
  
  function volumeCreditsFor(aPerformance) {
    let result = 0;
    result += Math.max(aPerformance.audience - 30, 0);
    if ("comedy" === playFor(aPerformance).type) result += Math.floor(aPerformance.audience /
		5);
    return result;
  }
  
  function playFor(aPerformance) {
    return plays[aPerformance.playID];
  }
  
  function amountFor(aPerformance) {
    let result = 0;
    switch (playFor(aPerformance).type) {
      case "tragedy":
        result = 40000;
        if (aPerformance.audience > 30) {
          result += 1000 * (aPerformance.audience - 30);
        }
        break;
      case "comedy":
        result = 30000;
        if (aPerformance.audience > 20) {
          result += 10000 + 500 * (aPerformance.audience - 20);
        }
        result += 300 * aPerformance.audience;
        break;
      default:
        throw new Error(`unknown type: ${playFor(aPerformance).type}`);
		}
    return result;
  }
}
```

现在代码结构已经好多了。顶层的statement函数现在只剩7行代码，而且它处理的都是与打印详单相关的逻辑。与计算相关的逻辑从主函数中被移走，改由一组函数来支持。每个单独的计算过程和详单的整体结构，都因此变得更易理解 了。

## 5. 拆分计算阶段与渲染阶段---自定义数据结构 重点

到目前为止，重构主要是为原函数添加足够的结构，以便我能更好地理解它，看清它的逻辑结构。
个人觉得不需要他人讲解看清逻辑结构是无论大小工程都应该做到这一步的。

接着讲重构，此时，我要修改的功能部分，为这张详单提供一个HTML版本。

问题是，这些分解出来的函数嵌套在打印文本详单的函数中。无 论嵌套函数组织得多么良好，我总不想将它们全复制粘贴到另一个新函数中。
我希望同样的计算函数可以被文本版详单和HTML版详单共用。

这里我们的目标是将逻辑分成两部分：

- 数据层 ----  计算详单所需的数据
- 渲染层 ---- 渲染 成文本或HTML

> 数据层创建一个中转数据结构，再把它传递给渲染层

### 中转数据结构

题外话: 
 从用户的角度看---显示在页面上的数据才是有效数据，这些数据以不同的排列组合最终显示到页面上。
然而，由于数据类型和非空原因，历史原因，进度原因，页面改动原因，以及实际工作中的协调成本，我们不能百分百的要求返回的数据与绘制完全契合。

此时我们设计的中转数据结构就显得极为重要。或者这个结构可以叫做适配结构或者防腐层。

结合例子，我们最终想得到的是

**statement.js**

```js
import createStatementData from './createStatementData.js';
function statement (invoice, plays) {
  return renderPlainText(createStatementData(invoice, plays));
}
function renderPlainText(data, plays) {
  let result = `Statement for ${data.customer}\n`;
  for (let perf of data.performances) {
    result += ` ${perf.play.name}: ${usd(perf.amount)} (${perf.audience} seats)\n`;
  }
  result += `Amount owed is ${usd(data.totalAmount)}\n`;
  result += `You earned ${data.totalVolumeCredits} credits\n`;
  return result;
}
function htmlStatement (invoice, plays) {
  return renderHtml(createStatementData(invoice, plays));
}
function renderHtml (data) {
  let result = `<h1>Statement for ${data.customer}</h1>\n`;
  result += "<table>\n";
  result += "<tr><th>play</th><th>seats</th><th>cost</th></tr>";
  for (let perf of data.performances) {
    result += ` <tr><td>${perf.play.name}</td><td>${perf.audience}</td>`;
    result += `<td>${usd(perf.amount)}</td></tr>\n`;
  }
  result += "</table>\n";
  result += `<p>Amount owed is <em>${usd(data.totalAmount)}</em></p>\n`;
  result += `<p>You earned <em>${data.totalVolumeCredits}</em> credits</p>\n`;
  return result;
}
function usd(aNumber) {
  return new Intl.NumberFormat("en-US",
                                { style: "currency", currency: "USD",
}
```

**createStatementData.js**

```js
export default function createStatementData(invoice, plays) {
   const result = {};
   result.customer = invoice.customer;
   result.performances = invoice.performances.map(enrichPerformance);
   result.totalAmount = totalAmount(result);
   result.totalVolumeCredits = totalVolumeCredits(result);
   return result;
}
function enrichPerformance(aPerformance) {
	const result = Object.assign({}, aPerformance);
	result.play = playFor(result);
	result.amount = amountFor(result);
	result.volumeCredits = volumeCreditsFor(result);
	return result;
}
function playFor(aPerformance) {
	return plays[aPerformance.playID]
}
function amountFor(aPerformance) {
    let result = 0;
    switch (aPerformance.play.type) {
        case "tragedy":
            result = 40000;
            if (aPerformance.audience > 30) {
                result += 1000 * (aPerformance.audience - 30);
            }
            break;
        case "comedy":
            result = 30000;
            if (aPerformance.audience > 20) {
                result += 10000 + 500 * (aPerformance.audience - 20);
            }
            result += 300 * aPerformance.audience;
            break;
        default:
            throw new Error(`unknown type: ${aPerformance.play.type}`);
    }
    return result;
}
function volumeCreditsFor(aPerformance) {
    let result = 0;
    result += Math.max(aPerformance.audience - 30, 0);
    if ("comedy" === aPerformance.play.type) result += Math.floor(aPerformance.audience / 5);
    return result;
}
function totalAmount(data) {
    return data.performances
        .reduce((total, p) => total + p.amount, 0);
}
function totalVolumeCredits(data) {
    return data.performances
        .reduce((total, p) => total + p.volumeCredits, 0);
}
```

这里我的步子迈的稍微有点大，详细的步骤可以阅读[原书](https://github.com/mlx92/read-refactor/blob/main/%E9%87%8D%E6%9E%84%E6%94%B9%E5%96%84%E6%97%A2%E6%9C%89%E4%BB%A3%E7%A0%81%E7%9A%84%E8%AE%BE%E8%AE%A1%E7%AC%AC2%E7%89%88.pdf)，我的本意是更加注意当前 `createStatementData`中的数据。不管他内部是怎么实现的，只要提供给页面渲染时能保证数据的正确就可以。

## 6. 按类型重组计算过程

接下来我将注意力集中到下一个特性改动:支持更多类型的戏剧，以及支持 它们各自的价格计算和观众量积分计算。对于现在的结构，我只需要在计算函数里添加分支逻辑即可。amountFor函数清楚地体现了，戏剧类型在计算分支的选 择上起着关键的作用——但这样的分支逻辑很容易随代码堆积而腐坏

要为程序引入结构、显式地表达出`计算逻辑的差异是由类型代码确定`,最自然的解决办法还是使用面向对象世界里的一个经典特性——类型多态。

我的设想是先建立一个继承体系，它有“喜剧”(comedy)和“悲 剧”(tragedy)两个子类，子类各自包含独立的计算逻辑。调用者通过调用一个 多态的amount函数，让语言帮你分发到不同的子类的计算过程中。volumeCredits 函数的处理也是如法炮制。

### 创建计算器基类

enrichPerformance函数是关键所在，因为正是它用每场演出的数据来填充中 转数据结构。目前它直接调用了计算价格和观众量积分的函数，我需要创建一个 类，通过这个类来调用这些函数。由于这个类存放了与每场演出相关数据的计算 函数，于是我把它称为演出计算器(performance calculator)

```js
function enrichPerformance(aPerformance) {
   const calculator = new PerformanceCalculator(aPerformance);
   const result = Object.assign({}, aPerformance);
   result.play = playFor(result);
   result.amount = amountFor(result);
   result.volumeCredits = volumeCreditsFor(result);
   return result; 
}
```

```js
class PerformanceCalculator {
  constructor(aPerformance) {
    this.performance = aPerformance;
  }
}
```

我们最主要的目的是将函数搬移基类中，让不同的子类去实现同一个函数从而得到不同的计算方式。但是同时也会将play字段搬移进去，这样可以把所有数据转换集中到一处地方，保证了代码的一致性和清晰度。

```js
class PerformanceCalculator {
  constructor(aPerformance, aPlay) {
    this.performance = aPerformance;
    this.play = aPlay;
  }
  get amount() {
     throw new Error('subclass responsibility');
  }
   get volumeCredits() {
     return Math.max(this.performance.audience - 30, 0);
	}
}
class TragedyCalculator extends PerformanceCalculator {
		get amount() {
     let result = 40000;
     if (this.performance.audience > 30) {
       result += 1000 * (this.performance.audience - 30);
     }
     return result;
   }
}
class ComedyCalculator extends PerformanceCalculator {
    get amount() {
        let result = 30000;
        if (this.performance.audience > 20) {
            result += 10000 + 500 * (this.performance.audience - 20);
        }
        result += 300 * this.performance.audience;
        return result;
    }
    get volumeCredits() {
        return super.volumeCredits + Math.floor(this.performance.audience / 5);
    }
}
```

**createStatementData.js**

```js
export default function createStatementData(invoice, plays) {
    const result = {};
    result.customer = invoice.customer;
    result.performances = invoice.performances.map(enrichPerformance);
    result.totalAmount = totalAmount(result);
    result.totalVolumeCredits = totalVolumeCredits(result);
    return result;
    function enrichPerformance(aPerformance) {
        const calculator = createPerformanceCalculator(aPerformance, playFor(aPerformance));
        const result = Object.assign({}, aPerformance);
        result.play = calculator.play;
        result.amount = calculator.amount;
        result.volumeCredits = calculator.volumeCredits;
        return result;
    }
    function playFor(aPerformance) {
        return plays[aPerformance.playID]
    }
    function totalAmount(data) {
        return data.performances
            .reduce((total, p) => total + p.amount, 0);
    }
    function totalVolumeCredits(data) {
        return data.performances
            .reduce((total, p) => total + p.volumeCredits, 0);
    }
}
function createPerformanceCalculator(aPerformance, aPlay) {
    switch (aPlay.type) {
        case "tragedy": return new TragedyCalculator(aPerformance, aPlay);
        case "comedy": return new ComedyCalculator(aPerformance, aPlay);
        default:
            throw new Error(`unknown type: ${aPlay.type}`);
    }
}
```

## 结语

这个例子示范了数种重构手法，

- 提炼函数
- 内联变量
- 搬移函数
- 以多态取代条件表达式

三个重点的阶段分别是：

- 将原函数分解成一组嵌套的函数
- 应用拆分阶段分离计算逻辑与输出格式化逻辑
- 为计算器引入 多态性来处理计算逻辑

平添了很多结构只为达到一个目标

> 任何一个人都能轻而易举地修改它。

一段健康的代码是有人需要修改代码时，他们应能轻易找到修改点，应该能快速做出更
改，而不易引入其他错误，这样的代码也能最大限度地提升我们的生产力，支持我们更快、更低成本地为用户添加新特性

**## 参考**

[^1]: 重构改善既有代码的设计第2版(https://github.com/mlx92/read-refactor/blob/main/%E9%87%8D%E6%9E%84%E6%94%B9%E5%96%84%E6%97%A2%E6%9C%89%E4%BB%A3%E7%A0%81%E7%9A%84%E8%AE%BE%E8%AE%A1%E7%AC%AC2%E7%89%88.pdf)

