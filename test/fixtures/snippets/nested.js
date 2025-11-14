// line 1

// #region outer
function outer() {
  // #region inner
  function inner() {
    console.log('inner')
  }
  // #endregion inner
  
  console.log('outer')
}
// #endregion outer

// #region nested-test
function test1() {
  // #region nested-test
  function test2() {
    console.log('test2')
  }
  // #endregion nested-test
  
  console.log('test1')
}
// #endregion nested-test

// line 26
