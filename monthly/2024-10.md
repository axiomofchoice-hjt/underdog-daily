---
title: 败犬のC++每月精选 2024-10
---

# {{ $frontmatter.title }}

[[toc]]

## 1. 线程安全哈希表 benchmark

![img](/img/2024-10-16-0.png)

完整 benchmark 见 [https://www.boost.org/doc/libs/develop/libs/unordered/doc/html/unordered.html#benchmarks_boostconcurrent_flat_map](https://www.boost.org/doc/libs/develop/libs/unordered/doc/html/unordered.html#benchmarks_boostconcurrent_flat_map)

boost 的项目足够新，后发优势，可以抄其他项目的优秀设计，flat_hashmap 性能可能是知名实现里最好的。

## 2. std::vector 扩容系数 1.5 为什么比 2 好

我们知道，std::vector 在容量不够时会申请新的一块空间，这个空间大小 = 原来的大小乘以扩容系数。MSVC 是 1.5，GCC / Clang 是 2。

唯一正解：实测 1.5 比 2 性能好！

***

folly 文档是这么写的：1.5 不一定能实现内存复用，但存在复用的概率；而 2 不存在理论复用的可能。这里的内存复用是怎么一回事呢？

我们考虑一个简单的场景：不断给一个 vector push_back 操作。

假设一开始 vector 容量是 V，扩容系数 p，那么接下来的 n 次扩容容量分别是：$V,Vp,Vp^2,...,Vp^n$。

接下来一次扩容，会申请 $Vp^{n+1}$ 的容量（并且这次申请我们打算复用之前用过的内存）。此时之前已经释放了 $V,Vp,Vp^2,...,Vp^{n-1}$ 的内存（注意 $Vp^n$ 还没释放），这些内存加起来大于等于即 $Vp^{n+1}$ 就可以内存复用。

$$V+Vp+Vp^2+...+Vp^{n-1}=\dfrac{V(p^n-1)}{p-1}\ge Vp^{n+1}$$

考虑 n 趋向于无穷大：

$$\dfrac{Vp^n}{p-1}\ge Vp^{n+1}$$

$$\dfrac{1}{p-1}\ge p$$

$$p(p-1)\le 1$$

$$\dfrac{-\sqrt{5}+1}{2}\le p \le \dfrac{\sqrt{5}+1}{2}$$

$p \le 1.618$ 就是这么来的。

***

但是实际上内存分配器行为并不是那样的，内存复用在大多数情况都没有说服力（内存分配器一般会把大小近似的内存块放一起，导致复用的内存几乎不可能是同一个 vector 扩容留下的）。

所以实测才是最好的理由。

## 3. 两个在不同命名空间，但是字段完全一样的结构体，可以直接强制类型转换吗

[https://zh.cppreference.com/w/cpp/language/reinterpret_cast](https://zh.cppreference.com/w/cpp/language/reinterpret_cast)：“在实际上不代表适当类型的对象的泛左值（例如通过 reinterpret_cast 所获得）上进行代表非静态数据成员或非静态成员函数的成员访问将导致未定义行为。”

虽然是未定义行为但也不会出什么问题。最好可以 bitcast / memcpy，这是标准行为。

严格别名的 reinterept_cast 都是 ub。

## 4. c 如何提供接口让 cpp 传 lambda 进去

提供 `void* context, void(*func)(void*)` 接口，类似 FunctionRef，有一些 C 库就是这样干的。

示例：

```cpp
#include <functional>
#include <iostream>

void registerCallback(void* context, void (*func)(void*)) { func(context); }

struct Content {
    std::function<void()> bind;
    static void call(void* self) { static_cast<Content*>(self)->bind(); }
};

int main() {
    int x = 233;
    auto lambda = [x]() { std::cout << x << std::endl; };
    Content content{lambda};

    registerCallback(&content, Content::call);
    return 0;
}
```

## 5. 为什么以前的人不注重缓存

因为那会确实差距不算大吧，而且还有各种 cache line 不一样所以考虑 cache oblivious 的情况。

[https://colin-scott.github.io/personal_website/research/interactive_latency.html](https://colin-scott.github.io/personal_website/research/interactive_latency.html)

一个底层的东西一般得好几年才会被上面的感觉到。

关于 cache oblivious，大多数 CPU 都是 64 字节 cache line，可能远古时期有小于 64 的；IBM 可能有 128 的机器。

## 6. 一个库申请的内存到另一个库释放，发生了崩溃

谁申请谁释放，这个原则可以规避这类问题。

***

我们来分析一下为什么崩溃：

内存申请释放一般走 glibc / musl 之类的库。

glibc 这样的库，它的 malloc 依赖它里面定义的全局变量状态；这样的全局变量出现多份就会出现上述问题。

不光是 malloc，别的函数比如 fopen 这种分配句柄的，都得一个全局的变量（状态）来记录已经分配的内存 / 句柄。把 A 变量分配的 handle 交给 B 变量释放，就会 crash。

根本原因是 ODR 违背导致的，跨动态库使用变量导致 crash。

所以问题就变成，静态链接 / 动态链接的符号可见性以及符号合并的情况了。要想知道啥时候链接器不合并，就去查动态库符号可见性；静态链接符号合并规则和动态链接符号合并规则不同。

***

模板隐式实例化也会有类似问题。动态库和主程序各一份实例化（实例化的时候只能看见自己的 malloc free 啥的），而且未合并。

值得注意的是，隐式实例化在静态链接的时候一定是会合并的，但是动态链接的时候则情况非常复杂了。

***

扩展阅读：[https://zhuanlan.zhihu.com/p/692886292](https://zhuanlan.zhihu.com/p/692886292)

## 7. Java 能不能鸭子类型

普通的继承：声明的时候得写明它继承了 Duck 类。

鸭子类型：只要这个类实现了 fly()，它就是鸭子。

Go 和动态类型语言（Python, JS）都是采用鸭子类型。（C++ 的 proxy 库可能也是？）

Java 可以通过反射来完成。

## 8. 头文件用了 libcurl 头文件，需要 pimpl 隐藏 libcurl 吗

问题的代码如下：

```cpp
#include <curl/curl.h>

#include <queue>

namespace Test {
class Client {
   public:
    struct TaskPackage {
        CURL *curl{nullptr};
        curl_slist *curlHeaders{nullptr};
    };

   private:
    std::queue<TaskPackage> m_queue{};
};
}  // namespace Test
```

不需要 pimpl。

头文件前置声明所需要的所有东西（CURL, curl_slist），源文件再 include curl.h。

如果 Client 这个类里面某个字段的类型是 libcurl 里面定义的，那就把这个字段定义成 unique_ptr。

这样头文件不需要感知任何 libcurl 里面定义的类型。

## 9. C++ 升个版本有那么难吗

正常情况下版本就是要规律更新的啊，语言也好依赖也好。锁死在某个旧版本是会欠技术债的。

一万年不升级，突然有一天想升，那当然全是问题；如果有完善的 CI，定期升小版本，基本每次升级一片绿，稍微改几个 deprecated 的接口，不是多恐怖的事情。

之所以叫债，就是因为它总有一天要还的。

当然这种事情是技术团队负责人而不是普通打工人应该做的。
