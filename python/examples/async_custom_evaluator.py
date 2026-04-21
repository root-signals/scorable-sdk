from scorable import Scorable

aclient = Scorable(run_async=True)


async def main():
    custom_evaluator = await aclient.evaluators.acreate(
        name="Direct language",
        predicate="Is the following text clear and has no weasel words: {{response}}",
        intent="Is the language direct and unambiguous",
        model="gpt-5.4",
    )

    response = await custom_evaluator.arun(response="It will probably rain tomorrow.")

    print(response.score)
