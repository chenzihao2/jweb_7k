<!-- vscode-markdown-toc -->
* 1. [Usage](#Usage)
* 2. [Javascript和TypeScript基础学习](#JavascriptTypeScript)
* 3. [1. Controller方法注解](#Controller)
	* 3.1. [1.1 注解的调用顺序](#)
	* 3.2. [1.2 注解中的错误处理](#-1)
		* 3.2.1. [如何抛出错误？](#-1)
		* 3.2.2. [如何处理错误？](#-1)
	* 3.3. [1.3 如何编写自定义函数注解？](#-1)
		* 3.3.1. [注解示例](#-1)
		* 3.3.2. [示例的依赖说明](#-1)
		* 3.3.3. [注解的编写步骤](#-1)
	* 3.4. [1.4 使用注解实现完整业务功能的示例](#-1)
* 4. [2. Entity校验注解](#Entity)
	* 4.1. [2.1 使用示例](#-1)
	* 4.2. [2.2 注解的调用顺序](#-1)
	* 4.3. [2.4 jweb内置注解和说明](#jweb)
		* 4.3.1. [Min](#Min)
		* 4.3.2. [Max](#Max)
		* 4.3.3. [Size](#Size)
		* 4.3.4. [Required](#Required)
		* 4.3.5. [Type](#Type)
	* 4.4. [2.5 编写自己的验证器](#-1)
		* 4.4.1. [自定义验证器示例](#-1)
		* 4.4.2. [示例关键代码说明](#-1)
		* 4.4.3. [自定义验证器必须遵循的规则](#-1)

<!-- vscode-markdown-toc-config
	numbering=true
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->
# jweb
A typeScript httpServer support annotation

##  1. <a name='Usage'></a>Usage

```
npm install
npm run build
npm run start
```

##  2. <a name='JavascriptTypeScript'></a>Javascript和TypeScript基础学习
JavaScript基础学习（ES6标准）：http://es6.ruanyifeng.com/#README

TypeScript基础学习：https://www.tslang.cn/docs/home.html

ejs模版引擎学习：https://ejs.co  |  https://ejs.bootcss.com/

# JWeb Controller方法注解和Entity中校验注解


##  3. <a name='Controller'></a>1. Controller方法注解

###  3.1. <a name=''></a>1.1 注解的调用顺序

先看一个样例（下面的方法都是某一个Controller类中的方法），process方法会在请求到来时被调用：

```typescript
  private preAround (ret) {
    console.log('preAround', ret)
  }

  private postAround (ret) {
    console.log('postAround', ret)
  }  

  private beforeCall (ret) {
    console.log('beforeCall' , ret)
    return ret
  }

  public afterCall (ret) {
    console.log('afterCall', ret)
    if (ret.err) {
      return {
        status: -1,
        err: ret.err
      }
    } else {
      return ret.data
    }
  }  
  @Get('/process/{uid0}')
  @Auth
  @ResponseBody('json')
  @Validation(UserEntity)
  @Transactional
  public async process (req: Request, res: Response, { uid0 }) {
    const user: UserEntity = req.entity
    console.log('inside call', user)
    let u = await this.userService.hello(user)
    let data = {
      a: 1,
      b: [2, 3, 4],
      uid: uid0,
      u: u
    }
    return data
  }
```

在样例函数中，定义了preAround、postAround、beforeCall和afterCall，使用了5个注解，每个注解都有一个preCall和postCall的属性，这两个属性的值是一个函数，如下：

```typescript
Auth.preCall = function authPreCall(ret: any, param: string, req: Request, res: Response) {
  if (param === 'ignore') {
    return {
      err: "ignore",
      data: null,
      from: Auth.name
    }
  }
  return ret
}

Auth.postCall = function authPostCall(ret: any) {
  return ret
}
```

注解的调用基于上述两处代码，调用的原则是：



* 首先调用beforeCall
* 然后按照注解使用从上向下的顺序调用preCall
* 然后调用Controller类中的preAround
* 然后调用被注解的方法，在上例中调用process方法
* 然后调用Controller类中的postAround
* 最后按照注解使用从下到上的顺序调用postCall

在上面的示例中，调用链是（Get方法只会在初始化的时候调用，用于注册路由，不会参与到此处的调用链中）：

beforeCall => Auth.preCall => ResponseBody.preCall => ... => preAround=> process => postAround => Transanctionl.postCall => ... => Auth.postCall => afterCall

当然，没有为注解定义postCall或者preCall，那么跳过相关调用。



###  3.2. <a name='-1'></a>1.2 注解中的错误处理

​	每一个注解的统一返回格式是：

```js
{
    err,
    data
}
```

前一个注解调用的返回结果会传递给后一个注解调用，例如：

```js
Auth.preCall = function authPreCall(ret: any, param: string, req: Request, res: Response) {
  if (param === 'ignore') {
    return {
      err: "ignore",
      data: null
    }
  }
  return ret
}
```

上述preCall函数中的参数ret，是上一个调用的返回值，Auth.preCall的返回值也会传给下一个调用。**如果没有return，会使用之前在调用链上传递的ret传给下一个调用**



####  3.2.1. <a name='-1'></a>如何抛出错误？

如果注解调用中发生了错误，有两种错误抛出方式：

* **如果需要继续执行调用链**：在返回值中设置err属性，该属性可以是字符串，也可以是对象，只要不为null，就表明错误发生。这意味着你可以定义自己的错误结构，方便后面的错误捕获和处理。
* **如果需要中断调用链**：直接在preCall或者postCall中return null，当检测到调用链中某一个调用的返回值是null时，不会继续执行调用链。**注意：这时框架不会响应请求，如果你希望中断调用链，那么你必须使用函数参数中的Request和Response自定义HTTP响应，如设置状态码，设置响应头，设置响应体。例如，在Auth中如果验证失败，你可能会返回401状态码**

如果路由函数中要抛出错误，需要throw BusinessException，BusinessException位于jbean包中。例如：

```typescript
  @Get('/process/{uid0}')
  @Auth
  @ResponseBody('json')
  @Validation(UserEntity)
  @Transactional
  public async process (req: Request, res: Response, { uid0 }) {
    const user: UserEntity = req.entity
    let u = await this.userService.hello(user)

    throw new BusinessException('test Exception') // 在路由函数中抛出错误
    let data = {
      a: 1,
      b: [2, 3, 4],
      uid: uid0,
      u: u
    }
    return data
  }
```



####  3.2.2. <a name='-1'></a>如何处理错误？

​	如果是设置err的错误抛出方式，自定义的注解需要自行定义错误处理方式。通过参数中的上一个函数的返回值中的err属性，可以监听到前面的调用链中是否发生了错误。发生与未发生错误时如何处理完全由注解自行决定。**如果调用链上的错误始终未被处理，则服务器会返回500错误**

关于自定义注解的编写请参阅: [1.3 如何编写自定义注解？](#1.3 如何编写自定义注解？)

**注意：jweb提供的内置注解，比如Validation，如果检测到错误，会直接return ret**



如果中断调用链，必须自行处理响应。



###  3.3. <a name='-1'></a>1.3 如何编写自定义函数注解？

####  3.3.1. <a name='-1'></a>注解示例

先看一个自定义注解的例子：

```typescript
import { AnnotationType, annotationHelper, BeanFactory } from 'jbean'
import { Request, Response } from 'jweb'
import { jsonEncode, xmlEncode } from '../../lib/utils'

export default function ResponseBody (component?: any, type?: any) {
  return annotationHelper(arguments, callback)
}

const callback = function (annoType: AnnotationType, ctor: object | Function) {
  if (annoType === AnnotationType.clz) {
    BeanFactory.addBeanMeta(AnnotationType.clz, ctor, null, ResponseBody, [arguments[2]])
  } else if (annoType === AnnotationType.method) {
    BeanFactory.addBeanMeta(AnnotationType.method, ctor, arguments[2], ResponseBody, [arguments[4]])
  }
}

ResponseBody.preCall = function rbdPreCall(ret: any, type: string, req: Request, res: Response) {
  switch (type) {
    case 'json':
      res.type('application/json')
      break
    case 'xml':
      res.type('application/xml')
      break
    default:
      break
  }
  console.log("response body precall", ret)
  return ret
}

ResponseBody.postCall = function rbdPostCall(ret: any, type: string, req: Request, res: Response) {
  console.log("jsonbody line 31", ret)
  switch (type) {
    case 'json':
      if (typeof ret === 'object') {
        ret.data = jsonEncode(ret.data)
      }
      break
    case 'xml':
      ret.data = xmlEncode(ret.data)
      break
    default:
      break
  }
  return ret
}

```

​	上述代码定义了一个名为ResponseBody的注解，该注解的主要功能是，根据@ResponseBody('{type}')来决定返回的数据格式类型，type可选值是json或者xml。接下来我们讨论该注解的详细定义过程。

####  3.3.2. <a name='-1'></a>示例的依赖说明

* 首先，注解相关的处理都在jbean包中，这里我们从JBean中引入了AnnotationType、annotationHelper、BeanFactory。其中：

  * AnnotationType：用于定义注解的类型，jweb中支持的注解类型有三种，类、方法、域。分别对应AnnotationType.clz，AnnotationType.method，AnnotationType.field

  * annotationHelper：jbean提供的分析注解参数的函数，该函数接收两个参数，args和callback，args是参数；callback是回调函数，在annotationHelper执行完毕后调用。annotationHelper会根据args参数计算出注解类型，以及能够从[typescript注解](<https://www.tslang.cn/docs/handbook/decorators.html>)获取对应的**构造函数/原型对象、键名、descriptor对象等**，细节请参阅[typescript注解](<https://www.tslang.cn/docs/handbook/decorators.html>)。拿到这些数据后，annotationHelper会将其作为参数传入给callback。**callback的详细参数列表请参阅[callback参数列表](#callback参数列表)**

    annotationHelper统一处理[TypeScript装饰器工厂](<https://www.tslang.cn/docs/handbook/decorators.html#decorator-factories>)和装饰器直接使用，比如Auth('ignore')和@Auth分别对应工厂调用和直接调用

  * BeanFactory：管理Bean、BeanMeta等信息的工厂类。**如果我们希望我们定义的注解的preCall和postCall在请求到来时调用，需要将对应的BeanMeta注册到BeanFactory中**

####  3.3.3. <a name='-1'></a>注解的编写步骤

##### 1. 导入依赖：

```js
import { AnnotationType, annotationHelper, BeanFactory } from 'jbean'
import { Request, Response } from 'jweb'
import { jsonEncode, xmlEncode } from '../../lib/utils'
```

注意：jsonEncode，xmlEncode是自行编写格式处理工具，与jweb和jbean无关。

##### 2. 定义注解：

```typescript
export default function ResponseBody (component?: any, type?: any) {
  return annotationHelper(arguments, callback)
}
```

​	其中ResponseBody是我们定义的注解名，当作为工厂调用时，即以@ResponseBody('参数1', '参数2')形式调用时，ResponseBody函数的参数就是工厂调用时传入的参数。否则其参数是typescript装饰器传入的参数。

​	我们使用时，可直接传arguments，annotationHelper会帮助我们处理所有细节，并将统一的参数形式传到callback中。接下来我们详细解释callback的使用。

##### 3. 定义callback方法：

```typescript
const callback = function (annoType: AnnotationType, ctor: object | Function) {
  if (annoType === AnnotationType.clz) {
    BeanFactory.addBeanMeta(AnnotationType.clz, ctor, null, ResponseBody, [arguments[2]])
  } else if (annoType === AnnotationType.method) {
    BeanFactory.addBeanMeta(AnnotationType.method, ctor, arguments[2], ResponseBody, [arguments[4]])
  }
}
```

###### callback参数列表

```js
const callback = function(annoType: AnnotationType, ctor: Function|object, field: string, descriptor: PropertyDescriptor, ...args)
```

参数说明：

* annoType：注解的类型，取值为AnnotationType.clz，AnnotationType.method，AnnotationType.field，分别代表类，方法，域
* ctor：构造函数或者原型对象
* field：如果被注解的是方法或者域，则该值存在且为键名
* descriptor：如果被注解的是方法，则该值存在且为该方法对应的描述符对象
* ...args：注解工厂调用时传入的参数，例如@ResponseBody('json')中传入的‘json'

**注意，如果你希望你的注解在被注解的函数调用时调用，请确保将其添加到BeanFactory的BeanMeta中，并定义响应的preCall、postCall函数**。因为callback仅会在初始化时调用。

注册BeanMeta请参考下面的代码：

```typescript
BeanFactory.addBeanMeta(AnnotationType.method, ctor, arguments[2], ResponseBody, [arguments[4]])
```



##### 4. 定义preCall、postCall函数

​	preCall可以在路由函数被调用前调用，可以起到拦截作用，如果你的业务中需要拦截器功能的话，定义preCall就可以实现。postCall在路由函数被调用后调用，可以对数据进行加工。preCall、postCall的使用、参数请参考上述示例。



###  3.4. <a name='-1'></a>1.4 使用注解实现完整业务功能的示例

一个完整的Controller示例代码如下：

```typescript
import { Autowired } from 'jbean'
import { BaseController, Controller, Get, Post, Request, Response, Transactional, Validation } from 'jweb'
import UserService from '../lib/account/UserService'
import PayService from '../lib/account/PayService'
import Auth from '../annos/Auth'
import ResponseBody from '../annos/response_body'
import UserEntity from '../lib/account/entity/user'

@Controller('/user')
@Transactional
export default class User extends BaseController {

  @Autowired('userService0')
  private userService: UserService

  @Autowired
  private payService: PayService

  constructor () {
    super()
  }

  private beforeCall (ret) {
    return ret
  }

  public afterCall (ret) {
    console.log('afterCall', ret)
    if (ret.err) {
      return {
        status: -1,
        err: ret.err
      }
    } else {
      return ret.data
    }
  }

  @Get('/process/{uid0}')
  @Auth
  @ResponseBody('json')
  @Validation(UserEntity)
  @Transactional
  public async process (req: Request, res: Response, { uid0 }) {
    const user: UserEntity = req.entity
    console.log('inside call', user)
    let u = await this.userService.hello(user)
    let data = {
      a: 1,
      b: [2, 3, 4],
      uid: uid0,
      u: u
    }
    return data
  }
}
```

这里我们只关注和process方法有关的部分，Get('/process/{uid0}')注册了一个动态路由，其路由参数是uid0。然后会一次依据[1.1 注解的调用顺序](#1.1 注解的调用顺序)调用注解和方法。**注意，注解调用链的参数传递与process方法无关，process方法只关注自身的业务处理，所以这里没有返回{err,data,from}这种结构，也不会被传入ret，process方法直接返回data**



在这个示例中，我们将错误的统一拦截放到了afterCall中：

```typescript
public afterCall (ret) {
    console.log('afterCall', ret)
    if (ret.err) {
      return {
        status: -1,
        errmessage: ret.err
      }
    } else {
      return {
          status: 1
          data: ret.data
      }
    }
  }
```

我们获取前面传过来的ret，判断是否发生了错误，如果发生了错误，将业务定义的错误码以及错误信息返回。

如果成功，将成功码和获取到的数据返回。

##  4. <a name='Entity'></a>2. Entity校验注解

###  4.1. <a name='-1'></a>2.1 使用示例

user.ts

```typescript
import { Entity, Type } from 'jweb'
import {Required, Min, Max, Size} from 'jweb'

@Entity
export default class User {

  @Type('string')
  @Required("uid是必填的参数")
  public uid = undefined

  @Required
  @Size(20, 30, 'name的长度应该位于20-30之间')
  public name = undefined

  @Type('number', true)
  @Required("age is required")
  @Min(18)
  @Max(100)
  public age = undefined

}
```

代码中定义了一个User类，类上有@Entity注解，@Entity表明这是一个实体类，与某一张数据库表相对应，会自动根据类名生成表名，如上例中，对应user表。默认的表名规则是下划线分割驼峰式命名，例如：PersonLikeBeer会对应表person_like_beer。

可以通过给@Entity传参数可以自定义表名，例如：@Entity('user_log')表名当前的类对应user_log表。

**注意到每一个字段都给了一个默认值undefined，这是因为如果不给默认值，typescript编译后不会生成对应的属性**

可以通过给表中的字段添加验证注解，来进行参数的校验，在上例中：

```typescript
  @Type('number', true)
  @Required("age is required")
  @Min(18)
  @Max(100)
  public age = undefined
```

* @Type('number', true) 表明这个字段必须是数字，true表示运行进行转换以期望得到正确的类型。**注意，一般情况下请将其设置成true，因为获取到的参数默认都是字符串，例如：可能表单提交的是21，但是获取的参数会是'21'，这时候会导致验证不通过。但如果你不想其他类型转为字符串，可以不写或者传false**。
* @Required("age is required")表明这个字段是必须的，括号里面的是验证不正确时的提示信息，如果不给定，会使用默认的提示信息
* @Min(18)最小值18
* @Max(100)最大值100

###  4.2. <a name='-1'></a>2.2 注解的调用顺序

注解会按照使用顺序，从上到下调用，如果一个字段有多个验证规则，中间有一个规则不通过时，不会继续验证后面的规则，直接使用该注解的错误信息。

每一个注解验证后会返回一个值，这个值会传给下一个验证注解，最后的验证注解返回的值会赋值给对应的字段。

所有注解的最后一个参数都是验证出错时提供的消息，如果没有提供该参数，将会使用默认值。

###  4.3. <a name='jweb'></a>2.4 jweb内置注解和说明

####  4.3.1. <a name='Min'></a>Min

使用：@Min(minval:number，mes?: string)

规则：对应字段的值是否比@Min指定的值大

####  4.3.2. <a name='Max'></a>Max

使用：@Max(minval:number，mes?: string)

规则：对应字段的值是否比@Max指定的值小

####  4.3.3. <a name='Size'></a>Size

使用：@Size(minval:number，maxval?:number, mes?: string)

规则：对应字段的值是否在指定的区间中

####  4.3.4. <a name='Required'></a>Required

使用：@Requred(mes?: string)

规则：必须的字段

####  4.3.5. <a name='Type'></a>Type

使用：@Type(type?: string)

规则：字段的数据类型，可选值string、number、integer

###  4.4. <a name='-1'></a>2.5 编写自己的验证器

####  4.4.1. <a name='-1'></a>自定义验证器示例

```typescript
import { AnnotationType, annotationHelper, BeanFactory } from 'jbean'

export default function Max(maxVal: number, mes?: string) {
  return annotationHelper([maxVal, mes], callback)
}
function validate(maxVal: number) {
  return (val):{valid: boolean, val: any} => {
    if (val <= maxVal) {
      return {valid: true, val: val}
    } else {
      return { valid: false, val: null}
    }
  }
}
function message(field: string, maxVal:number, mes?: string) {
  if (mes) {
    return () => mes
  } else {
    return () => `the value of ${field} must smaller than ${maxVal}`
  }
}
Max['validate'] = {}
const callback = function(annoType: AnnotationType, ctor: Function, field: string, maxVal:number, mes?: string) {
  // add descriptor info into BeanFactory, using it in Validation
  Max['validate'][field] = {
    validate: validate(maxVal),
    message: message(field, maxVal, mes)
  }
  BeanFactory.addBeanMeta(annoType, ctor, field, Max)
}
```

####  4.4.2. <a name='-1'></a>示例关键代码说明

每一个验证器需要两个方法，一个是validate，用于验证是否满足规则，另一个是message，用于返回验证失败时的消息。**请确保传给Max\['validate'\]\[field\]的validate和message属性的值均是函数。validate和message返回的函数都会被传入一个参数——被验证的字段的值**

我们将这两个方法与挂在到对应注解方法的validate属性上，在示例中是Max['validate']，然后:

```typescript
Max['validate'][field] = {
    validate: validate(maxVal),
    message: message(field, maxVal, mes)
  }
```

使用field是因为不同的域上可能有相同的注解，而验证规则可能是闭包相关的，所以这里为每一个域都绑定validate和message方法。

最后需要把注解注册到BeanFactory中，采用让其validate和message函数在验证时被调用。

####  4.4.3. <a name='-1'></a>自定义验证器必须遵循的规则

1. 确保验证器函数有如下属性，且validate和message必须是函数。

   ```typescript
   Max['validate'][field] = {
       validate: validate(maxVal),
       message: message(field, maxVal, mes)
   }
   ```

2. 在{ validate: validate(maxVal), message: message(field, maxVal, mes) }中，validate返回值的结构必须是下面的形式：

   ```typescript
   {
       valid: boolean, // 表示验证是否成功，如果成功，其值为true，否则为false
       val: any // 验证之后应该返回的值，这个值会传给下一个验证器
   }
   ```

   **val的值会传给下一个验证器，最后一个验证器的val值会赋值给实体，注意验证成功或者失败时返回的val值**

   message返回值必须是一个字符串，用作验证失败时的提示信息。

3. 确保验证器被注册到BeanFactory中，调用如下API注册

   ```typescript
   BeanFactory.addBeanMeta(annoType, ctor, field, Max)
   ```