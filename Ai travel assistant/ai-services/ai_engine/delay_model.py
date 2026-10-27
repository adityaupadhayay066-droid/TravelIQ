import torch
import torch.nn as nn

class TrainDelayLSTM(nn.Module):
    def __init__(self, vocab_sizes, embedding_dims):
        super(TrainDelayLSTM, self).__init__()
        self.emb_train = nn.Embedding(vocab_sizes['train'], embedding_dims['train'])
        self.emb_route = nn.Embedding(vocab_sizes['route'], embedding_dims['route'])
        self.emb_weather = nn.Embedding(vocab_sizes['weather'], embedding_dims['weather'])
        
        in_dim = embedding_dims['train'] + embedding_dims['route'] + embedding_dims['weather'] + 3
        self.shared = nn.Sequential(
            nn.Linear(in_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU()
        )
        # Dedicated heads: regression for minutes, sigmoid for bounded delay probability [0, 1]
        self.head_delays = nn.Sequential(
            nn.Linear(32, 2),
            nn.ReLU() # Delay minutes are non-negative
        )
        self.head_prob = nn.Sequential(
            nn.Linear(32, 1),
            nn.Sigmoid() # Probability strictly in [0.0, 1.0]
        )

    def forward(self, train_idx, route_idx, weather_idx, num_feats):
        e1 = self.emb_train(train_idx)
        e2 = self.emb_route(route_idx)
        e3 = self.emb_weather(weather_idx)
        x = torch.cat([e1, e2, e3, num_feats], dim=-1)
        h = self.shared(x)
        delays = self.head_delays(h)
        prob = self.head_prob(h)
        return torch.cat([delays, prob], dim=-1)
