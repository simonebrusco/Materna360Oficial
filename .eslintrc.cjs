{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "import/first": "error"
  },
  "overrides": [
    {
      "files": ["components/**/*.{ts,tsx}"],
      "rules": {
        "no-restricted-syntax": [
          "error",
          {
            "selector": "Literal[value=/\\b(Bom dia|Boa tarde|Boa noite)\\b/i]",
            "message": "Do not hardcode greeting prefixes in client components. Always consume the fully formatted server string."
          },
          {
            "selector": "TemplateLiteral[quasis.0.value.raw=/\\b(Bom dia|Boa tarde|Boa noite)\\b/i]",
            "message": "Do not construct greeting templates on the client; render the server-provided string verbatim."
          },
          {
            "selector": "BinaryExpression[operator='+'] > Literal[value=/\\b(Bom dia|Boa tarde|Boa noite)\\b/i]",
            "message": "Avoid concatenating greeting prefixes on the client. Use server-rendered greetings instead."
          }
        ]
      }
    }
  ]
}
