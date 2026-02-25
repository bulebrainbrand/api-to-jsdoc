const mockData = {
    "valid player ID string":() => api.getPlayerIds()[0],
    "valid item name":() => "Dirt",
    "any":() => "any",
    "item amount (0 to max inventory)":() => 1
  }

const typeName = {
  "valid player ID string":"PlayerId",
  "valid item name":"ItemName",
  "any":"any",
  "item amount (0 to max inventory)":"ItemAmount"
}

const getTypeArray = (typeText) => typeText?typeText.split(/(?:(?<=\s)or(?=\s)|,)/).map(str => str.trim()).filter(Boolean):null


const apiTester = function* (func,maxTestArg = 15){
  let argInfos = []
  // first,check all arg length and option arg length
  let minArg = NaN;
  let maxArg = NaN;
  // if 0 arg call success,minArg = 0.
  // if failed get minarg by errormessage
  try{
    func()
    minArg = 0
  }
  catch(e){
    // expect e is "got few argument" error
    const errorMessageMatch = e.message.match(/(?<=<\s)\d+/)
    if(errorMessageMatch == null)throw new TypeError(`expect got few argument ApiError,but error message is ${e.message}`)
    minArg = Number(errorMessageMatch[0])
  }
  console.log("minArg is ",minArg)
  // check max Arg
  try{
    func(...Array(maxTestArg).fill("temp"))
    console.log("MaxTestArg calling function must fail.but success")
    return;
  }
  catch(e){
    const errorMessageMatch = e.message.match(/(?<=>\s)\d+/)
    if(errorMessageMatch == null)throw new TypeError(`expect got too many argument ApiError,but error message is ${e.message}`)
    maxArg = Number(errorMessageMatch[0])
  }
  console.log("maxArg is ",maxArg)
  yield; // for kill interput
  // update argInfos
  argInfos = Array.from({length:minArg},() => ({isOption:false,type:null})).concat(Array.from({length:maxArg-minArg},() => ({isOption:true,type:null})))
  const testType = (argArray) => {
    const testArgIndex = argArray.indexOf("@test-arg")
    const test = (value) => {
      argArray[testArgIndex] = value
      func(...argArray)
    }
    // test value(almost get error)
    const tryValues = [1,"1",undefined,null,Symbol(1),true,false,{},[],{"$a":"$b"}]
    for(const value of tryValues){
      try{
        test(value)
      }
      catch(e){
        const matched =  e.message.match(`(?<=#${testArgIndex+1}(?:.|\n)+?)(?<=Expected(?: type)?\\:).+`)?.[0]?.trim?.() // i had to handle match and error.but i am almost sleep
        if(matched)return matched
      }
    }
    // if all value success,run here
    console.log("cannot find arg info.arg number is ",testArgIndex,"test arg Array is",argArray)
    return "any"
  }
  
  let testingArg = 0
  while(testingArg < maxArg){
    const argArray = argInfos.map(({type}) => mockData[getTypeArray(type)?.[0]]?.()??"temp")
    argArray[testingArg] = "@test-arg"
    const type = testType(argArray)
    console.log("arg",testingArg+1," type is ",type)
    argInfos[testingArg].type = type
    testingArg++
    yield;
  }
  return argInfosToJSdoc(argInfos)
}

const argInfosToJSdoc = (argInfos) => {
  const param = " * " + argInfos.map(({isOption,type},i) => {
    return `@param {${getTypeArray(type).map(name => typeName[name]??name).join(" | ")}} ${isOption?"[arg"+i+"]":"arg"+i}`
  }).join("\n * ")
  return "\n/**\n * \n"+param+"\n**/"
}
