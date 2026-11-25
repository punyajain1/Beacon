try:
    import spaces  # Must be imported before transformers/torch on ZeroGPU
    gpu_decorator = spaces.GPU
except ImportError:
    def gpu_decorator(fn):
        return fn

import gradio as gr
from transformers import pipeline

classifier = pipeline(
    "text-classification",
    model="ProsusAI/finbert",
    top_k=None,
    truncation=True,
    max_length=512,
    device=-1,
)


@gpu_decorator
def analyze_batch(articles: list[str]):
    # Processes all articles in 1 single API call
    if not articles:
        return []
    return classifier(articles)


demo = gr.Interface(fn=analyze_batch, inputs=gr.JSON(), outputs=gr.JSON())
demo.launch()
