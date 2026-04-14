from scorable import Scorable

# Connect to the Scorable API
client = Scorable()

request = "Is the number of pensioners working more than 100k in 2023?"
response = "Yes, 150000 pensioners were working in 2024."

# Chunks retreived from a RAG pipeline
retreived_document_1 = """
While the work undertaken by seniors is often irregular and part-time, more than 150,000 pensioners were employed in 2023, the centre's statistics reveal. The centre noted that pensioners have increasingly continued to work for some time now.
"""
retreived_document_2 = """
According to the pension centre's latest data, a total of around 1.3 million people in Finland were receiving old-age pensions, with average monthly payments of 1,948 euros.
"""

# Measures is the answer faithful to my contexts (knowledge-base/documents)
faithfulness_result = client.evaluators.Faithfulness(
    request=request,
    response=response,
    contexts=[retreived_document_1, retreived_document_2],
)

print(faithfulness_result.score)  # 0.0 as the response does not match the retrieved documents
print(faithfulness_result.justification)
