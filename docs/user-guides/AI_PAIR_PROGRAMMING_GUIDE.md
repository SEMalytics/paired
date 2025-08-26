# AI Pair Programming - User Guide

## What is AI Pair Programming?

AI Pair Programming is like having an expert coding partner who:
- **Suggests code completions** as you type
- **Reviews your code** in real-time for quality and bugs
- **Connects you with AI agents** (Edison, Sherlock, Leonardo) for specialized help
- **Learns your coding style** and gets better over time

## Getting Started

### Step 1: Enable AI Assistance
1. Open any code file in your IDE
2. Look for the **PAIRED** panel (usually on the right side)
3. Click **Enable AI Pair Programming**
4. You'll see a green indicator showing AI assistance is active

### Step 2: Start Coding
1. Begin typing in your code file
2. AI suggestions appear as gray text after your cursor
3. Press **Tab** to accept a suggestion
4. Press **Esc** to dismiss a suggestion

**Example:** Type `function calculateT` and you'll see:
```
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```
Press Tab to accept this complete function.

## How to Use AI Suggestions

### Getting Code Completions

**As You Type:**
- AI automatically suggests completions based on your context
- Suggestions appear in gray text after your cursor
- More context = better suggestions

**Making Suggestions Better:**
- Add comments describing what you want: `// Create a function to validate email addresses`
- Include variable names that hint at purpose: `const userEmail = `
- Use descriptive function names: `validateEmailFormat` vs `validate`

**Example Workflow:**
1. Type: `// Calculate shipping cost based on weight and distance`
2. Start typing: `function calculateShipping`
3. AI suggests: `function calculateShippingCost(weight, distance) { ... }`
4. Press **Tab** to accept

### Accepting or Rejecting Suggestions

**When to Accept:**
- Suggestion matches what you intended
- Code looks correct and follows your style
- Saves you significant typing time

**When to Reject:**
- Suggestion doesn't match your intent
- Code has obvious errors
- Doesn't follow your project's patterns

**Feedback Helps AI Learn:**
- Accepting good suggestions improves future recommendations
- Rejecting poor suggestions teaches AI your preferences
- AI adapts to your coding style over time

### Real-Time Code Review

**AI Reviews Your Code as You Write:**
- Green checkmark ✅ = Code looks good
- Yellow warning ⚠️ = Minor issues to consider
- Red error ❌ = Problems that need fixing

**What Gets Reviewed:**
- **Security vulnerabilities** (SQL injection, XSS, etc.)
- **Performance issues** (inefficient loops, memory leaks)
- **Code quality** (readability, maintainability)
- **Best practices** (error handling, naming conventions)

**How to Use Code Review:**
1. Write your code normally
2. Look for colored indicators in the margin
3. Hover over indicators to see specific feedback
4. Click **Fix** to apply suggested improvements

**Example Review Feedback:**
```
⚠️ Performance Warning (Line 23)
This loop could be slow with large arrays.
Suggestion: Use Array.filter() instead of manual loop.
[Show Fix] [Ignore]
```

### Getting Agent Help

### Getting Help from AI Agents

**When to Ask for Agent Help:**
- **Stuck on a bug** → Ask Edison for debugging help
- **Security concerns** → Ask Sherlock for security review
- **Architecture decisions** → Ask Leonardo for design guidance
- **Code quality issues** → Ask any agent for their expertise

**How to Request Agent Help:**
1. Right-click in your code editor
2. Select **Ask PAIRED Agent**
3. Choose the agent you need:
   - **🔧 Edison**: "Help me debug this async function"
   - **🕵️ Sherlock**: "Review this code for security issues"
   - **🏛️ Leonardo**: "Is this the best architecture approach?"
4. Describe your specific problem
5. Agent responds with tailored advice

**Example Agent Conversations:**

**Edison (Debugging):**
```
You: "This function throws an error but I can't figure out why"
Edison: "I see the issue - you're not awaiting the database call on line 15. 
Try adding 'await' before db.query(). Also, wrap it in try/catch 
for better error handling."
```

**Sherlock (Security):**
```
You: "Is this login function secure?"
Sherlock: "I found 2 security concerns: 
1. Password isn't hashed (use bcrypt)
2. No rate limiting (add express-rate-limit)
Want me to show you how to fix these?"
```

**Leonardo (Architecture):**
```
You: "Should I use microservices or monolith for this project?"
Leonardo: "Based on your team size (5 developers) and requirements, 
I recommend starting with a modular monolith. You can split into 
microservices later when you have 15+ developers."
```

## Getting the Most Value

### Daily Workflow Integration

**Morning Routine:**
1. Open your main project files
2. Check PAIRED panel for any overnight insights
3. Review yesterday's productivity stats
4. Set AI assistance level for today's work

**During Development:**
- Let AI suggest completions for repetitive code
- Ask agents for help when stuck (don't struggle alone)
- Use real-time review to catch issues early
- Accept/reject suggestions to improve AI learning

**End of Day:**
- Review your productivity stats
- Check what code quality improvements AI suggested
- Note which agent interactions were most helpful

### Measuring Your Success

**Track These Metrics:**
- **Time Saved**: Hours saved through AI completions
- **Code Quality**: Improvement in review scores
- **Bug Reduction**: Fewer issues caught in testing/production
- **Learning Speed**: How quickly you implement new patterns

**Typical Results After 30 Days:**
- 25-40% faster coding on routine tasks
- 50% fewer bugs in initial code
- 30% improvement in code review scores
- Increased confidence tackling complex problems

### Session Insights

**Track Your Productivity:**
- **Completions Used**: How many AI suggestions you accepted today
- **Time Saved**: Estimated time saved through AI assistance
- **Code Quality**: Improvement in code quality scores
- **Agent Interactions**: How often you got help from Edison, Sherlock, Leonardo

**View Your Stats:**
1. Click **PAIRED Stats** in the bottom panel
2. See daily/weekly productivity metrics
3. Compare with your previous performance
4. Get personalized recommendations for improvement

## Customizing Your AI Experience

### Adjusting AI Behavior

**Completion Style Settings:**
- **Conservative**: Only suggests when you pause typing
- **Balanced**: Regular suggestions without being intrusive (recommended)
- **Aggressive**: Frequent suggestions and completions

**How to Change Settings:**
1. Open PAIRED settings panel
2. Go to **AI Pair Programming** tab
3. Adjust **Suggestion Frequency** slider
4. Choose **Code Review Level** (Basic/Standard/Comprehensive)
5. Select which agents to enable for automatic help

### Learning Your Coding Style

**AI Adapts to Your Preferences:**
- **Naming conventions**: Learns if you prefer camelCase vs snake_case
- **Code structure**: Adapts to your function organization patterns
- **Comment style**: Matches your documentation preferences
- **Error handling**: Learns your preferred error handling patterns

**Improving AI Suggestions:**
- Accept good suggestions (teaches AI what you like)
- Reject poor suggestions (teaches AI what to avoid)
- Use consistent coding patterns (helps AI learn faster)
- Add comments explaining your intent (gives AI better context)

## Getting Smart Suggestions

**AI Proactively Suggests Improvements:**
- **Better patterns**: "Consider using async/await instead of callbacks"
- **Performance tips**: "This loop could be optimized with Array.map()"
- **Security fixes**: "This input should be sanitized"
- **Best practices**: "Add error handling for this API call"

**How Suggestions Appear:**
1. You'll see a lightbulb icon 💡 next to lines with suggestions
2. Click the lightbulb to see the suggestion
3. Preview shows before/after code
4. Click **Apply** to make the change

**Example Suggestion:**
```
💡 Security Improvement Suggested

Current code:
const query = `SELECT * FROM users WHERE id = ${userId}`;

Suggested improvement:
const query = 'SELECT * FROM users WHERE id = ?';
const result = await db.query(query, [userId]);

Reason: Prevents SQL injection attacks
```

## Real-World Usage Examples

### Example 1: Building a Login Function

**Your Goal**: Create a secure user login function

**Step-by-Step with AI:**
1. Type: `// Create secure login function`
2. Start typing: `async function loginUser`
3. AI suggests complete function structure
4. **Sherlock** automatically reviews for security issues
5. Sherlock suggests: "Add rate limiting and password hashing"
6. **Edison** helps implement bcrypt password verification
7. Final result: Secure, production-ready login function

### Example 2: Debugging an API Error

**Your Problem**: API calls are failing intermittently

**Getting AI Help:**
1. Highlight the problematic code
2. Right-click → **Ask Edison for Help**
3. Describe: "API calls fail sometimes, not sure why"
4. **Edison** analyzes and suggests: "Add retry logic and better error handling"
5. **Sherlock** adds: "Also check for timeout issues and rate limiting"
6. AI provides complete solution with retry mechanism

### Example 3: Optimizing Slow Code

**Your Issue**: Function is too slow with large datasets

**AI Assistance Process:**
1. AI automatically flags performance issue with ⚠️ warning
2. Click warning to see suggestion
3. **Leonardo** suggests architectural improvement: "Use streaming instead of loading all data"
4. **Edison** provides implementation: Shows how to implement streaming
5. Result: 10x performance improvement

### Example 4: Code Review Before Commit

**Before Committing Code:**
1. Select all your changes
2. Right-click → **Request Full AI Review**
3. **Sherlock** checks security and quality
4. **Leonardo** reviews architecture decisions
5. **Edison** tests logic and edge cases
6. Get comprehensive feedback before pushing to repository

## Tips for Better AI Assistance

### Getting Better Suggestions

**Write Descriptive Comments:**
```javascript
// Good: AI understands your intent
// Calculate tax amount including state and federal rates
function calculateTax(amount, state) {

// Poor: AI has to guess what you want
function calc(a, s) {
```

**Use Clear Variable Names:**
```javascript
// Good: AI suggests relevant operations
const userEmail = 'user@example.com';
const isValidEmail = // AI suggests email validation

// Poor: AI can't understand context
const x = 'user@example.com';
const y = // AI suggests generic operations
```

**Provide Context:**
- Add imports at the top of files
- Include relevant comments about business logic
- Use consistent naming patterns
- Structure code in logical sections

### Working Effectively with Agents

**Be Specific in Your Requests:**
- **Good**: "Help me debug this React component that won't re-render when props change"
- **Poor**: "This doesn't work"

**Ask Follow-Up Questions:**
- "Can you explain why this approach is better?"
- "What are the potential downsides of this solution?"
- "How would this perform with 10,000 users?"

**Use Agents for Their Strengths:**
- **Edison**: Complex debugging, performance optimization, implementation details
- **Sherlock**: Security review, code quality, testing strategies
- **Leonardo**: System design, architecture decisions, scalability planning

## Troubleshooting

### "AI Suggestions Aren't Appearing"

**Check These:**
1. Is the PAIRED panel showing "AI Active" status?
2. Are you in a supported file type? (JS, Python, Java, etc.)
3. Try typing a comment describing what you want to do
4. Restart your IDE if suggestions stopped completely

### "Suggestions Are Poor Quality"

**Improve Suggestion Quality:**
1. Reject bad suggestions (teaches AI what you don't want)
2. Accept good suggestions (reinforces what you do want)
3. Add more context with comments and descriptive names
4. Check if you're working in an unfamiliar codebase (AI needs time to learn)

### "Agents Aren't Responding"

**Quick Fixes:**
1. Check internet connection
2. Verify PAIRED agents are running (ask your IT admin)
3. Try asking a different agent
4. Restart the PAIRED service: `./bin/paired restart`

**Still Having Issues?**
- Contact your IT administrator
- Check system status at status.paired-platform.com
- Email support@paired-platform.com with specific error details
