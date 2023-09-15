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

代码组织不甚清晰!  当我们需要修改系统时，就涉及了人。**差劲的系统是很难修改的**

可拓展性不高！当计费规则发生改变，积分规则计算出现变化，输出结果改变格式时 都需要读懂全部逻辑 并且修改原 statement 函数。作为 一个经验丰富的开发者，我可以肯定:**不论最终提出什么方案，他们一定会在6 个月之内再次修改它**。

结语：

是需求的变化使重构变得必要。如果一段代码能正常工作，并且不会再被修改，那么完全可以不去重构它。能改进之当然很好，但若没人需要去理解它，它就不会真正妨碍什么。
如果确实有人需要理解它的工作原理，并且觉得理解起来很费劲，那你就需要改进一下代码了。

## 2 重构第一步 - 测试驱动开发

> 重构前，先检查自己是否有一套可靠的测试集。这些测试必须有自我检验能力。

**进行重构时，我需要依赖测试**。我将测试视为bug检测器，它们能保护我不被自己犯的错误所困扰。把我想要达成的目标写两遍——代码里写一遍，测试里 再写一遍——我就得犯两遍同样的错误才能骗过检测器。
这降低了我犯错的概率，因为我对工作进行了二次确认。尽管编写测试需要花费时间，但却为我节省 下可观的调试时间。

## 3 分解 statement 函数

> 傻瓜都能写出计算机可以理解的代码。唯有能写出人类容易理解的代码的，才是优秀的程序员。

首先要明确的是一段好的代码，**一眼望过去我就该知道它在做什么**，回头看时，**我不需要重新思考一遍**。

### 3.1 抽离函数

最让人难懂的逻辑就是 switch 中计算金额的逻辑。我们要将他抽离出去，

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





