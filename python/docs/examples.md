# SDK features using concrete examples

These examples walk through some features of the platform in more detail.  
Full list of examples is available [here](https://github.com/root-signals/rs-python-sdk/tree/main/examples).

## Scorable evaluators

Scorable provides [over 30 ready-made](https://docs.scorable.ai/quick-start/usage/evaluators#list-of-evaluators-maintained-by-root-signals) evaluators that can be used to validate any textual content.


```{literalinclude} ../examples/preset_evaluator.py
```
```shell
# Score: 0.1 / 1.0

# Clarity:
# The response is very brief and lacks detail. It simply directs the reader to another source without providing any specific information.
# The phrase "instructions from our Careers page" is vague and does not specify...
```


## Custom evaluator

We can also create a custom evaluator. Evaluators return only floating point values between 0 and 1, based on how well the received text matches what the evaluator is described to look for.

```{literalinclude} ../examples/custom_evaluator.py
```
```shell
# Score: 0.3

# METRIC: Technical Accuracy and Appropriateness
# 
# 1.  Relevance: The initial response is generic and lacks...
```

## Monitoring LLM pipelines with tags, user ID and session ID

Evaluator runs can be tagged with free-form tags. User ID and session ID can be used to track the execution of a specific user in a specific session.

```{literalinclude} ../examples/run_tagging.py
```

## Adjust evaluator behavior

An evaluator behaviour can be adjusted by providing demonstrations.

```{literalinclude} ../examples/calibration.py
```


## Retrieval Augmented Generation (RAG) evaluation

For RAG, there are special evaluators that can separately measure the different intermediate components of a RAG pipeline, in addition to the final output. 

```{literalinclude} ../examples/run_rag.py
```

## Generate a judge

You can form a judge by describing your application and optionally the stage you want to evaluate. A judge is a collection of evaluators that can evaluate a component of your application.

```{literalinclude} ../examples/simple_judge.py
```

## Create a judge
If you already have a set of evaluators you wish to use for a specific use case, you can create a judge by giving the name, intent and list of evaluators.
```{literalinclude} ../examples/create_judge.py
```


## Add a model

Adding a model is as simple as specifying the model name and an endpoint. The model can be a local model or a model hosted on a cloud service.

```{literalinclude} ../examples/model.py
```

