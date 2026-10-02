import uuid

from django.conf import settings
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from .prompts import SYSTEM_PROMPT, build_strategy_prompt
from .rag import SearchResult, search_knowledge
from .schemas import (
    BudgetAllocation,
    BusinessProfile,
    ContextSource,
    StrategyRecommendation,
    StrategyResponse,
)


class OpenAIStrategyProvider:
    name = "openai"

    def __init__(self) -> None:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required")
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        reraise=True,
    )
    def generate(self, prompt: str) -> StrategyRecommendation:
        response = self.client.responses.parse(
            model=settings.OPENAI_MODEL,
            instructions=SYSTEM_PROMPT,
            input=prompt,
            text_format=StrategyRecommendation,
            store=False,
            timeout=30,
        )
        if response.output_parsed is None:
            raise ValueError("The LLM response did not contain structured output")
        recommendation = response.output_parsed
        total = sum(item.percentage for item in recommendation.budget_allocation)
        if total != 100:
            raise ValueError("LLM budget allocation must total 100 percent")
        return recommendation


def _choose_channel(profile: BusinessProfile) -> str:
    preferred = profile.preferred_channels
    text = f"{profile.industry} {profile.product_service} {profile.target_audience}".casefold()
    if preferred:
        return preferred[0]
    if any(term in text for term in ("gen z", "video", "thời trang", "làm đẹp", "ăn uống")):
        return "TikTok"
    if any(term in text for term in ("tìm kiếm", "dịch vụ", "b2b", "phần mềm")):
        return "Google Ads"
    return "Meta"


def _fallback_strategy(profile: BusinessProfile) -> StrategyRecommendation:
    primary = _choose_channel(profile)
    channels = [primary] + [
        channel for channel in ("Meta", "Google Ads", "TikTok") if channel != primary
    ]
    allocations = [60, 25, 15]
    return StrategyRecommendation(
        recommended_channel=primary,
        segment=profile.target_audience,
        message=(
            f"{profile.business_name}: {profile.product_service} giúp {profile.target_audience} "
            f"đạt mục tiêu {profile.campaign_goal.lower()} một cách rõ ràng và đáng tin cậy."
        ),
        rationale=(
            f"Ưu tiên {primary} dựa trên ngành {profile.industry}, chân dung khách hàng và "
            "mục tiêu chiến dịch. Phân bổ còn lại dành cho thử nghiệm chéo kênh."
        ),
        budget_allocation=[
            BudgetAllocation(
                channel=channel,
                percentage=percentage,
                rationale="Kênh chính" if index == 0 else "Ngân sách thử nghiệm và đối chứng",
            )
            for index, (channel, percentage) in enumerate(zip(channels, allocations, strict=True))
        ],
        actions=[
            "Thiết lập một nhóm quảng cáo thử nghiệm với tối thiểu hai biến thể thông điệp.",
            "Theo dõi CTR, CPA và ROAS theo ngày trong 7 ngày đầu.",
            "Chỉ tăng ngân sách cho biến thể đạt ngưỡng hiệu quả đã thống nhất.",
        ],
        confidence=70 if profile.historical_data else 55,
    )


def generate_strategy(profile: BusinessProfile) -> StrategyResponse:
    query = " ".join(
        [
            profile.industry,
            profile.product_service,
            profile.target_audience,
            profile.campaign_goal,
            *profile.preferred_channels,
        ]
    )
    context: list[SearchResult] = search_knowledge(query)
    prompt = build_strategy_prompt(profile, context)
    warning: str | None = None

    if settings.OPENAI_API_KEY:
        try:
            provider = OpenAIStrategyProvider()
            strategy = provider.generate(prompt)
            provider_name = provider.name
        except Exception as exc:
            if not settings.ALLOW_LLM_FALLBACK:
                raise
            strategy = _fallback_strategy(profile)
            provider_name = "deterministic-fallback"
            warning = (
                f"LLM tạm thời không khả dụng; đã dùng chiến lược dự phòng ({type(exc).__name__})."
            )
    else:
        strategy = _fallback_strategy(profile)
        provider_name = "deterministic-fallback"
        warning = "OPENAI_API_KEY chưa được cấu hình; kết quả dùng chế độ Sprint 1 ngoại tuyến."

    return StrategyResponse(
        request_id=str(uuid.uuid4()),
        strategy=strategy,
        context_sources=[
            ContextSource(source=item.source, title=item.title, score=round(item.score, 4))
            for item in context
        ],
        provider=provider_name,
        warning=warning,
    )
