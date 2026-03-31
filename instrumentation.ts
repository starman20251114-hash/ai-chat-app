export async function register() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "[warning] ANTHROPIC_API_KEY is not set. " +
        "AI chat requests will fail. " +
        "Set the variable in .env.local before starting the server."
    );
  }
}
