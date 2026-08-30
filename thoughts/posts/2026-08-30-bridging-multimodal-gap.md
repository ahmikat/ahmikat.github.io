---
layout: thought
title: "Bridging the Multimodal Gap: Adapting CLIP to Low-Resource Languages"
date: 2026-08-30 00:01:00 +0600
description: "A compute-aware blueprint for extending CLIP to low-resource languages through text-space distillation, locked-image tuning, and carefully evaluated cultural adaptation."
permalink: /thoughts/adapting-clip-to-low-resource-languages/
---

CLIP showed that images and natural-language descriptions can be aligned in a shared embedding space. Once that space is learned, the model can perform tasks such as zero-shot image classification and cross-modal retrieval without being trained separately for every label set.

The difficulty is that the original CLIP was trained primarily with English text and approximately 400 million image-text pairs. Repeating that process for a low-resource language would require a scale of data and compute that most research groups do not have.

Fortunately, localization does not always mean starting again from zero. Research on multilingual CLIP models suggests a more practical strategy: reuse an existing visual space, teach a new text encoder to enter that space, and adapt the model only where local language and culture demand it.

## AltCLIP: separating language transfer from visual learning

AltCLIP replaces CLIP's English text encoder with the multilingual XLM-R encoder. Its training process separates text-space transfer from image-text alignment, reducing the amount of multimodal training required.

### Stage 1: text-only teacher learning

The original CLIP text encoder acts as a **teacher**, while XLM-R and a new projection layer form the **student**. Given parallel sentences in English and a target language, the student is trained to reproduce the teacher's English embedding.

In simplified form, the distillation objective is:

`L_distill = ||z_student - z_teacher||²`

Here, `z_student` is the target-language sentence embedding and `z_teacher` is the corresponding English CLIP embedding. Minimizing this distance encourages semantically equivalent sentences to occupy similar locations in CLIP's existing representation space. English-to-English examples are also used so that the new encoder retains its English capability.

This stage needs parallel text, but no images. That makes it much cheaper than end-to-end vision-language training.

### Stage 2: locked-image contrastive learning

The model is then trained on image-text pairs using a contrastive objective. The pretrained image encoder remains frozen while the multilingual text encoder learns a more precise alignment with its visual embeddings. This resembles the central result of Locked-image Tuning (LiT): a strong pretrained image encoder can be kept fixed while language-side training creates an effective zero-shot model.

Freezing the visual tower offers two practical advantages. It reduces trainable parameters, and its image embeddings can be precomputed when the data pipeline allows it. However, it also establishes an important boundary: the model can learn new names for the visual features already encoded, but the frozen vision encoder itself cannot adapt its features to underrepresented local imagery.

## Why native visual data still matters

Translated captions can teach cross-lingual alignment, but translation alone is not a substitute for native cultural data. A dataset may describe generic objects correctly in Bangla while still missing local food, clothing, places, signs, festivals, and everyday visual contexts.

CLIP-Italian offers a useful example of combining translated and native data. Its training corpus contained more than 1.4 million image-text pairs drawn from Italian WIT and MSCOCO-IT data, machine-translated Conceptual Captions, and 29,055 native pairs from *Il Post*'s “La Foto del Giorno.” The native source contributed descriptions written for an Italian audience rather than translations of an English dataset.

The authors also found that some WIT captions were dominated by encyclopedic proper nouns. They removed captions in which at least 80% of the words were tagged as proper nouns, filtering roughly 10% of WIT. This is a helpful reminder that more pairs do not automatically mean better supervision: captions should describe learnable visual content, not merely attach a highly specific name to an image.

Unlike AltCLIP's locked-vision stage, CLIP-Italian first warmed up its projection layers with both encoders frozen and then unfroze the model for end-to-end fine-tuning. The two approaches therefore address different constraints: one prioritizes efficient transfer, while the other allows the visual representation to adapt.

## A Bangla-oriented hybrid blueprint

The following is a **research proposal**, not an experimentally established recipe. It combines ideas from existing papers into a compute-aware sequence that could be tested for Bangla.

1. **Text-space distillation.** Use English-Bangla parallel text to map a multilingual or Bangla-focused encoder into the original CLIP text space. Include English preservation examples and evaluate both languages after distillation.

2. **Locked-vision alignment.** Train with translated and native Bangla image-text pairs while keeping the image encoder frozen. This stage should establish broad cross-modal alignment before any visual adaptation.

3. **Native cultural adaptation.** Build a smaller, carefully verified dataset of genuinely native Bangla captions and culturally relevant images. Instead of unfreezing the entire vision encoder, test LoRA adapters in selected attention modules. LoRA freezes the base weights and learns low-rank updates, making this a plausible parameter-efficient experiment. The exact trainable percentage depends on the chosen rank and target modules; it should be measured rather than assumed.

4. **Optional weight interpolation.** After merging the adapters into a compatible full checkpoint, evaluate WiSE-FT-style interpolation between the original and adapted weights. WiSE-FT has been shown to improve robustness under distribution shift, but its benefit for this particular multilingual LoRA pipeline would still need experimental validation.

## What should the experiment measure?

A localized model should not be judged by one retrieval score. A useful evaluation would include:

- Bangla-to-image and image-to-Bangla retrieval;
- zero-shot classification with Bangla prompts;
- a native cultural benchmark that is separate from the training set;
- English retention after each training stage;
- performance under translated, native, and out-of-distribution captions; and
- trainable parameters, GPU memory, training time, and total compute.

The data also needs strict provenance and duplicate checks. Native captions should be verified as actual descriptions of their paired images, not article headlines, filenames, or unrelated alt text.

## Important caveats

This blueprint reduces trainable parameters, but it does not guarantee that every stage will fit comfortably on a particular GPU. Feasibility still depends on image resolution, batch size, precision, optimizer states, activation checkpointing, and whether embeddings are precomputed.

LoRA was introduced for large language models; applying it to a CLIP vision encoder is a reasonable extension to test, not direct evidence that the proposed cultural-adaptation stage will work. Similarly, WiSE-FT requires checkpoints with the same architecture and compatible parameters. These details should be treated as experimental questions rather than promised outcomes.

The broader lesson is simple: low-resource multimodal research needs both efficiency and cultural coverage. Text distillation can transfer an existing alignment, locked-image training can stabilize it, and native data can reveal what translated datasets leave out. The strongest pipeline will be the one that measures each contribution separately.

## References & further reading

1. **Learning Transferable Visual Models From Natural Language Supervision** — Alec Radford, Jong Wook Kim, Chris Hallacy, Aditya Ramesh, Gabriel Goh, et al. The foundational CLIP paper. [arXiv:2103.00020](https://arxiv.org/abs/2103.00020)

2. **AltCLIP: Altering the Language Encoder in CLIP for Extended Language Capabilities** — Zhongzhi Chen, Guang Liu, Bo-Wen Zhang, Qinghong Yang, and Ledell Wu. Introduces the two-stage teacher-learning and contrastive-learning approach. [arXiv:2211.06679](https://arxiv.org/abs/2211.06679) · [ACL Anthology](https://aclanthology.org/2023.findings-acl.552/)

3. **Contrastive Language-Image Pre-training for the Italian Language** — Federico Bianchi, Giuseppe Attanasio, Raphael Pisoni, Silvia Terragni, Gabriele Sarti, and Sri Lakshmi. Studies localized CLIP training with translated and native Italian image-text data. [arXiv:2108.08688](https://arxiv.org/abs/2108.08688)

4. **LoRA: Low-Rank Adaptation of Large Language Models** — Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, Shean Wang, Lu Wang, and Weizhu Chen. Introduces trainable low-rank updates for parameter-efficient adaptation. [arXiv:2106.09685](https://arxiv.org/abs/2106.09685)

5. **LiT: Zero-Shot Transfer with Locked-image text Tuning** — Xiaohua Zhai, Xiao Wang, Basil Mustafa, Andreas Steiner, Daniel Keysers, Alexander Kolesnikov, and Lucas Beyer. Demonstrates the value of locked pretrained image encoders with trainable text towers. [arXiv:2111.07991](https://arxiv.org/abs/2111.07991)

6. **Robust Fine-Tuning of Zero-Shot Models** — Mitchell Wortsman, Gabriel Ilharco, Jong Wook Kim, Mike Li, Simon Kornblith, Rebecca Roelofs, Raphael Gontijo-Lopes, Hannaneh Hajishirzi, Ali Farhadi, Hongseok Namkoong, and Ludwig Schmidt. Introduces WiSE-FT weight-space ensembling for robustness. [arXiv:2109.01903](https://arxiv.org/abs/2109.01903)
