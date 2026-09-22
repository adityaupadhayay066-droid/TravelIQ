import torch
import torch.nn as nn

PERSONA_DETAILS = {
    0: {
        "name": "Budget Backpacker",
        "traits": "Cost-conscious, flexible schedule",
        "tips": "Use sleeper class and local thali options."
    },
    1: {
        "name": "Premium Business",
        "traits": "Time-sensitive, high comfort preference",
        "tips": "Book 1A/2A or express flights."
    },
    2: {
        "name": "Frequent Commuter",
        "traits": "Regular travel, values punctuality",
        "tips": "Opt for monthly pass & live tracking."
    },
    3: {
        "name": "Family Vacationer",
        "traits": "Group comfort, scheduled meals",
        "tips": "Reserve full bay in 3A & pre-order food."
    }
}

class UserBehaviorNet(nn.Module):
    def __init__(self, input_dim=5, num_classes=4):
        super(UserBehaviorNet, self).__init__()
        self.fc = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.ReLU(),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        return self.fc(x)
