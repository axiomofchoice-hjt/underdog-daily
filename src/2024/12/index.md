---
title: 败犬のC++每月精选 2024-12
prev: false
next: false
---

# {{ $frontmatter.title }}

[[toc]]

## 1. `auto&& t = T{};` 是不是安全的

安全，这个和 `const auto &t = T{};` 是一个道理，引用延长了生命周期。

[https://zh.cppreference.com/w/cpp/language/lifetime](https://zh.cppreference.com/w/cpp/language/lifetime) 里有记载：

> 可以通过绑定到引用来延长临时对象的生存期，细节见引用初始化。

右值引用的本职是实现移动语义，延长生存期只是为了让表现跟 `const T&` 一致。

## 2. `"-Wl,--icf=all"` 运行时不符合预期

这个链接选项会将二进制相同的函数合并，如果程序依赖它们的地址不同就会导致问题。（已知链接器 gold 会这么做）

推荐阅读 [模板膨胀开销](https://ykiko.me/zh-cn/articles/686296374/#%E7%9C%9F%E6%AD%A3%E7%9A%84%E6%A8%A1%E6%9D%BF%E8%86%A8%E8%83%80%E5%BC%80%E9%94%80)。

## 3. `std::function` 递归函数开销太大导致 leetcode 题目超时

`std::function` 的开销主要是两点：1. 有捕获的话，一般会在堆上申请内存；2. 类型擦除带来的虚函数调用。

关于第一点开销，function 和 any 一样可能有小对象优化（libc++ 是 ≤16B）。除此之外编译器很难对此进行优化。

递归最好只用 lambda 完成，具体做法在 [败犬日报 2024-10-08](https://underdog-daily.pages.dev/2024/10/08) 介绍过。

## 4. `std::hive` 容器

未来可能进 C++26。

`std::hive` 是一个对象池，支持 $O(1)$ 时间内的插入删除和双向迭代操作，插入删除不会导致其他迭代器失效。

实现原理：块状链表、跳跃域、空闲链表。

推荐阅读：[https://zhuanlan.zhihu.com/p/11456846151](https://zhuanlan.zhihu.com/p/11456846151)

## 5. 一个经典错误：`std::vector` 扩容导致引用失效

运行结果不符合预期：

```cpp
#include <bits/stdc++.h>
using namespace std;
constexpr int inf = numeric_limits<int>::max();
int main() {
    int n;
    cin >> n;
    vector<vector<int>> tr;
    tr.emplace_back(26, -1);
    vector<int> near{ 0 };
    for (int i = 0; i < n; i++) {
        string s;
        cin >> s;
        int len = s.size();
        int res = inf;
        function<int(int, int, bool)> go = [&](int cur, int matched, bool new_node) {
            if (!new_node)
                res = min(res, len - matched + near[cur]);
            if (matched == len)
                return near[cur] = 0;
            int& nxt = tr[cur][s[matched] - 'a'];
            bool nxt_new_node = false;
            if (nxt == -1) {
                near.push_back(inf);
                tr.emplace_back(26, -1);
                nxt = tr.size() - 1;
                nxt_new_node = true;
            }
            return near[cur] = min(near[cur], go(nxt, matched + 1, nxt_new_node) + 1);
        };
        go(0, 0, false);
        cout << res << '\n';
    }
    return 0;
}
```

`return near[cur] = min(near[cur], go(nxt, matched + 1, nxt_new_node) + 1);` 这句话中，如果 `near[cur]` 先执行得到引用 `const T &`，后执行 go 函数让 near 扩容从而使引用失效。

（为什么是“如果”，因为这两个部分的求值顺序是未指定的）

## 6. 神经网络相同输入会得到不同计算结果

很多时候不是故意的。

比如多线程的原子加，不能保证加法顺序，会出现误差不一致。

## 7. `std::enable_shared_from_this` 必须公开继承，否则调用会抛异常

`std::enable_shared_from_this` 不公开继承的话能过编译，但是调用就抛 `bad_weak_ptr`。

这个坑是比较隐蔽的。

为什么不直接编译错误？答案是允许 D 私有继承 B，B 公开继承 `std::enable_shared_from_this` 这种情况。[stackoverflow](https://stackoverflow.com/questions/56529757/why-does-enable-shared-from-this-crash-if-inheritance-is-not-public-instead-of-e)

检查可以用 clang tidy：[https://github.com/llvm/llvm-project/pull/102299](https://github.com/llvm/llvm-project/pull/102299)。

## 8. C++ module 可以用了吗

可以，推荐使用 clang，正常使用已经没问题。

主流支持 module 进度遥遥无期，可以在这看进度 [https://arewemodulesyet.org/](https://arewemodulesyet.org/)。但是 module 可以和头文件一起使用，从而规避问题。

对于编译速度有追求的用户可以使用 module，因为本来他们就已经使用 PCH（预编译头）来加速编译了，module 是 PCH 的超级加强版。PCH 只能线性依赖，module 可以是有向无环图。

## 9. `std::conditional_t` 会对未命中的 Type 做推导吗

会的。没有短路功能，如果是非良构的 Type 会报错。

可以用 constexpr if 来实现类似效果。

```cpp
template <bool B>
auto my_conditional_impl() {
    if constexpr (B) {
        return std::type_identity<TypeA>{};
    } else {
        return std::type_identity<TypeB>{};
    }
}

template <bool B>
using my_conditional_t = decltype(my_conditional_impl<B>())::type;
```

另一种方法是模板类包一层：

```cpp
template <typename>
struct good {};

template <>
struct good<int> {
    using type = int;
};

template <typename T>
struct LazyInit {
    using Type = typename good<T>::type;
};

int main() {
    using t =
        std::conditional_t<false, LazyInit<void>, int>;
}
```

## 10. 万能引用不匹配初始化列表

effective cpp 老生常谈。

```cpp
void f(auto &&) { std::cout << "1" << std::endl; }
void f(auto (&&)[]) { std::cout << "2" << std::endl; }
int main() {
    f({1, 2, 3});
    auto &&x = {1, 2, 3};
    f(std::move(x));
}
```

输出是 2 和 1。

`auto (&&)[]` 是对无边界数组的右值引用。

## 11. 宏里的变量名和宏外一致导致 bug

```cpp
#define CHECK(cmd) { int r = cmd; /*......*/ }

CHECK(func(a, b, c, r));
```

这段代码展开后是：

```cpp
{ int r = func(a, b, c, r); /*......*/ }
```

r 的初始化使用了未初始化的变量（就是 r 自己），而这个问题在编译器不会报错（`-Wall` 会有警告）。

由于宏只是简单的文本替换，会有命名空间问题，这是宏的缺陷之一。

解决方法自然是：在宏里使用一个不会和外部变量冲突的变量名。

## 12. 宏有哪些不可替代的功能

一些常见用法：

1. 嵌入 `__LINE__` 这种预定义宏。
2. 更灵活地生成函数 / 类的成员。
3. 结合拼接 `##` 的时候。
4. 还有 `#if` 这种条件编译的宏。

“如果能不用宏，就不用宏”原则，除了必要场景，宏和任何其他方案对比，都是 0 优势纯劣势。
