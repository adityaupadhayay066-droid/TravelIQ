import torch
import torch.nn as nn

INTENT_CLASSES = [
    "greeting",
    "fare_inquiry",
    "speed_inquiry",
    "delay_prediction",
    "booking_help",
    "food_recommendation",
    "safety_sos",
    "weather_info",
    "admin_metrics",
    "general_info"
]

class SimpleTokenizer:
    def __init__(self):
        self.vocab = {}
        self.inv_vocab = {}

    def fit_on_texts(self, texts):
        words = set()
        for t in texts:
            words.update(t.lower().split())
        for idx, w in enumerate(sorted(words), start=1):
            self.vocab[w] = idx
            self.inv_vocab[idx] = w

    def texts_to_sequences(self, texts):
        seqs = []
        for t in texts:
            seq = [self.vocab.get(w, 0) for w in t.lower().split() if w in self.vocab]
            if not seq:
                seq = [0]
            seqs.append(seq)
        return seqs

    def encode(self, text):
        seq = [self.vocab.get(w, 0) for w in text.lower().split() if w in self.vocab]
        return seq if seq else [0]

class ChatbotClassifierNet(nn.Module):
    def __init__(self, vocab_size, num_classes=10):
        super(ChatbotClassifierNet, self).__init__()
        self.emb = nn.EmbeddingBag(vocab_size + 10, 32, mode='mean')
        self.fc = nn.Sequential(
            nn.Linear(32, 32),
            nn.ReLU(),
            nn.Linear(32, num_classes)
        )

    def forward(self, flat_indices, offsets):
        x = self.emb(flat_indices, offsets)
        return self.fc(x)
