"""Create repeatable demo accounts for the Sprint 1 login flow."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from CastraServices.models import BusinessAccount

DEMO_USERS = (
    {
        "email": "owner@demo.castravision.vn",
        "business_name": "Cafe Ông Bụt",
        "industry": "Food & Beverage",
        "business_size": "Small",
        "target_customers": (
            "Người đi làm và sinh viên 18–35 tuổi tại TP.HCM, thích cà phê "
            "pha máy và không gian yên tĩnh."
        ),
        "primary_goal": "Tăng lượt khách đến quán và doanh thu theo tháng",
        "product_service": "Cà phê pha máy, bánh ngọt và không gian làm việc",
        "preferred_channels": ["Meta", "Google Ads", "TikTok"],
        "monthly_budget": 30_000_000,
    },
    {
        "email": "manager@demo.castravision.vn",
        "business_name": "Cafe Ông Bụt",
        "industry": "Food & Beverage",
        "business_size": "Small",
        "target_customers": (
            "Nhân viên văn phòng quanh cửa hàng cần điểm hẹn và nơi làm việc."
        ),
        "primary_goal": "Theo dõi hiệu quả chiến dịch và tối ưu chi phí",
        "product_service": "Combo cà phê và bánh cho buổi sáng",
        "preferred_channels": ["Meta", "Google Ads"],
        "monthly_budget": 20_000_000,
    },
    {
        "email": "member@demo.castravision.vn",
        "business_name": "Cafe Ông Bụt",
        "industry": "Food & Beverage",
        "business_size": "Small",
        "target_customers": "Khách trẻ 18–30 tuổi thích trải nghiệm đồ uống mới.",
        "primary_goal": "Sản xuất nội dung quảng cáo cho chiến dịch cuối tuần",
        "product_service": "Đồ uống theo mùa và không gian gặp gỡ bạn bè",
        "preferred_channels": ["Meta", "TikTok"],
        "monthly_budget": 12_000_000,
    },
)


class Command(BaseCommand):
    help = "Create or refresh the three CastraVision demo login accounts."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            required=True,
            help="Password assigned to all demo accounts (minimum 8 characters).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = options["password"]
        if len(password) < 8:
            raise CommandError("Demo password must contain at least 8 characters.")

        User = get_user_model()
        created_count = 0

        for item in DEMO_USERS:
            email = item["email"]
            user, created = User.objects.get_or_create(
                username=email,
                defaults={"email": email, "is_active": True},
            )
            user.email = email
            user.is_active = True
            user.set_password(password)
            user.save(update_fields=["email", "is_active", "password"])

            BusinessAccount.objects.update_or_create(
                user=user,
                defaults={
                    "business_name": item["business_name"],
                    "industry": item["industry"],
                    "business_size": item["business_size"],
                    "target_customers": item["target_customers"],
                    "primary_goal": item["primary_goal"],
                    "product_service": item["product_service"],
                    "preferred_channels": item["preferred_channels"],
                    "monthly_budget": item["monthly_budget"],
                    "currency": "VND",
                },
            )
            created_count += int(created)
            self.stdout.write(
                self.style.SUCCESS(
                    f"{'Created' if created else 'Updated'} demo user: {email}"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo login data ready: {len(DEMO_USERS)} users "
                f"({created_count} newly created)."
            )
        )
