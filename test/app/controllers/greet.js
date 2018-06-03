module.exports.greetGet = function greetGet (context) {
  const { name } = context.params.query

  return { greeting: `Hello, ${name}!` }
}
