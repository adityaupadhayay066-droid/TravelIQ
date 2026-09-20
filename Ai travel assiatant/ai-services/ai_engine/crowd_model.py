import torch
import torch.nn as nn

class StationCrowdNet(nn.Module):
    def __init__(self, vocab_size):
        super(StationCrowdNet, self).__init__()
        self.emb = nn.Embedding(vocab_size, 16)
        self.shared = nn.Sequential(
            nn.Linear(16 + 2, 32),
            nn.ReLU()
        )
        self.head_cls = nn.Linear(32, 4)
        self.head_reg = nn.Linear(32, 2)

    def forward(self, station_idx, num_feats):
        e = self.emb(station_idx)
        x = torch.cat([e, num_feats], dim=-1)
        h = self.shared(x)
        logits = self.head_cls(h)
        reg = self.head_reg(h)
        return logits, reg
