import torch
import torch.nn as nn

class RouteRecommenderNet(nn.Module):
    def __init__(self, num_users=250, num_routes=100):
        super(RouteRecommenderNet, self).__init__()
        self.user_emb = nn.Embedding(num_users + 10, 16)
        self.route_emb = nn.Embedding(num_routes + 10, 16)
        self.fc = nn.Sequential(
            nn.Linear(16 + 16 + 5, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, u_idx, r_idx, feats):
        u = self.user_emb(u_idx)
        r = self.route_emb(r_idx)
        x = torch.cat([u, r, feats], dim=-1)
        return self.fc(x)
