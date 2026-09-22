import torch
import torch.nn as nn

class TrainOccupancyNet(nn.Module):
    def __init__(self, vocab_sizes, embedding_dims):
        super(TrainOccupancyNet, self).__init__()
        self.emb_train = nn.Embedding(vocab_sizes['train'], embedding_dims['train'])
        self.emb_class = nn.Embedding(vocab_sizes['class'], embedding_dims['class'])
        
        in_dim = embedding_dims['train'] + embedding_dims['class'] + 3
        self.shared = nn.Sequential(
            nn.Linear(in_dim, 32),
            nn.ReLU()
        )
        self.head_reg = nn.Linear(32, 3)
        self.head_cls = nn.Linear(32, 3)

    def forward(self, train_idx, class_idx, num_feats):
        e1 = self.emb_train(train_idx)
        e2 = self.emb_class(class_idx)
        x = torch.cat([e1, e2, num_feats], dim=-1)
        h = self.shared(x)
        reg = self.head_reg(h)
        logits = self.head_cls(h)
        return reg, logits
