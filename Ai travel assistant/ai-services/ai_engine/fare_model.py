import torch
import torch.nn as nn

class SmartFareLSTM(nn.Module):
    def __init__(self, vocab_sizes, embedding_dims):
        super(SmartFareLSTM, self).__init__()
        self.emb_src = nn.Embedding(vocab_sizes['source'], embedding_dims['source'])
        self.emb_dst = nn.Embedding(vocab_sizes['dest'], embedding_dims['dest'])
        self.emb_class = nn.Embedding(vocab_sizes['class'], embedding_dims['class'])
        
        in_dim = embedding_dims['source'] + embedding_dims['dest'] + embedding_dims['class'] + 3
        self.fc = nn.Sequential(
            nn.Linear(in_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 1)
        )

    def forward(self, src_idx, dst_idx, class_idx, num_feats):
        e1 = self.emb_src(src_idx)
        e2 = self.emb_dst(dst_idx)
        e3 = self.emb_class(class_idx)
        x = torch.cat([e1, e2, e3, num_feats], dim=-1)
        return self.fc(x)
