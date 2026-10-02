from typing import Literal

from pydantic import BaseModel, Field, field_validator


class HistoricalMetric(BaseModel):
    channel: Literal["Meta", "Google Ads", "TikTok", "Other"]
    period: str = Field(min_length=1, max_length=80)
    ctr: float | None = Field(default=None, ge=0)
    cpa: float | None = Field(default=None, ge=0)
    roas: float | None = Field(default=None, ge=0)
    notes: str = Field(default="", max_length=500)


class BusinessProfile(BaseModel):
    business_name: str = Field(min_length=2, max_length=120)
    industry: str = Field(min_length=2, max_length=120)
    business_size: Literal["Micro", "Small", "Medium", "Large"]
    product_service: str = Field(min_length=3, max_length=500)
    target_audience: str = Field(min_length=3, max_length=500)
    campaign_goal: str = Field(min_length=3, max_length=300)
    budget: float = Field(gt=0, le=1_000_000_000)
    currency: Literal["VND", "USD"] = "VND"
    preferred_channels: list[Literal["Meta", "Google Ads", "TikTok"]] = Field(
        default_factory=list, max_length=3
    )
    historical_data: list[HistoricalMetric] = Field(default_factory=list, max_length=30)

    @field_validator(
        "business_name", "industry", "product_service", "target_audience", "campaign_goal"
    )
    @classmethod
    def strip_text(cls, value: str) -> str:
        return " ".join(value.split())


class BudgetAllocation(BaseModel):
    channel: str
    percentage: int = Field(ge=0, le=100)
    rationale: str


class StrategyRecommendation(BaseModel):
    recommended_channel: str
    segment: str
    message: str
    rationale: str
    budget_allocation: list[BudgetAllocation]
    actions: list[str]
    confidence: int = Field(ge=0, le=100)


class ContextSource(BaseModel):
    source: str
    title: str
    score: float = Field(ge=-1, le=1)


class StrategyResponse(BaseModel):
    request_id: str
    strategy: StrategyRecommendation
    context_sources: list[ContextSource]
    provider: str
    warning: str | None = None
