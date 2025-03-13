# Semantics

In this file I compiled a list of semantic definitions and requirements. The purpose of this is to have a nice, simple and comprehensive 
list of all semantics checks I will have to take care of. The format is as follows:
    - AST node, where I have to check the semantic rule
        - If there is a `*` at the end of the AST Node name, it means this rule should be applied in interpreter
    - Definition (or simplified definition)
    - Reference in the C99 specification
    - Implementation check (empty = no)

All information in this file were acquired from the [ISO/IEC 9899:TC3 WG14/N1256 Commitee Draft](https://open-std.org/JTC1/SC22/WG14/www/docs/n1256.pdf)
available at https://open-std.org/JTC1/SC22/WG14/www/docs/n1256.pdf. Although this is only the draft, it differs only minimally from the final C99
standard[^1]

Another very good source of compiled information about the C language is [cppreference.com](https://en.cppreference.com/w/c/language). If there are any doubts this site
should clear them up.

## Expressions
|            AST Node                                         |          Definition                                                      | Reference | Implemented? |
|-------------------------------------------------------------|--------------------------------------------------------------------------|-----------|--------------|
| [BArithExpr](./src/ast/expr.js), [UExpr](./src/ast/expr.js) | The operands of operations ~, <<, >>, &, ^, \| must have the type of int. In case they are not they are converted (promoted) to integer type (integer promotion). If the right operand is negative or greater or greater or equal to the width of the promoted left operand, the behavior is *undefined* | §6.5.7 | |
| [BAssignExpr](./src/ast/expr.js) | The expression must have a type compatible with type of the object | §6.5 | |
| [SubscriptExpr](./src/ast/expr.js)\* | Definition of `[]` operator is that `E1[E2]` is identical to `(*((E1)+(E2)))` | §6.5.2.1 | |
| [FncCallExpr](./src/ast/expr.js) | The number of arguments in function call shall agree with the number of parameters | §6.5.2.2 | Yes |
| [UExpr](./src/ast/expr.js)\* | The result of **postfix** `++, --` operators is the value of the operand | §6.5.2.5 | |
| [Initializer](./src/ast/declaration.js)\* | The size of an uspecified size shall be determined by the initializer list | §6.5.2.5 | |
| [Declaration](./src/ast/declaration.js)\* | The result of the declaration is pointer to the object `int *p = (int []){2, 4};` | §6.5.2.5 | |
| [UExpr](./src/ast/expr.js)\* | The result of a **prefix** `++, --` operators is the incremented value of the operand | §6.5.3.1 | |
| [UExpr](./src/ast/expr.js) | The operand of `&` is function name, result of `[]`, `*` operator or an object | §6.5.3.2 | |
| [UExpr](./src/ast/expr.js) | The operand of `*` is pointer type | §6.5.3.2 | |
| [BArithExpr](./src/ast/expr.js)\* | If the operand of `*, %` is a 0, the behavior is undefined | §6.5.5 | Throw an RTError | 
| [BArithExpr](./src/ast/expr.js)\* | When integers are divided the result is quotient, any fractional part is discarded | §6.5.6 | |

[^1]: https://en.cppreference.com/w/Cppreference:FAQ
