from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tailors_app.models import TailorProfile, TailoringRequest, Review, Notification
import random
from datetime import datetime, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')

        # Create sample users
        users_data = [
            {
                'username': 'john_doe',
                'email': 'john@example.com',
                'name': 'John Doe',
                'phone': '+1234567890',
                'location_lat': 40.7128,
                'location_lng': -74.0060,
                'is_tailor': False
            },
            {
                'username': 'jane_smith',
                'email': 'jane@example.com',
                'name': 'Jane Smith',
                'phone': '+1234567891',
                'location_lat': 40.7589,
                'location_lng': -73.9851,
                'is_tailor': False
            },
            {
                'username': 'mike_wilson',
                'email': 'mike@example.com',
                'name': 'Mike Wilson',
                'phone': '+1234567892',
                'location_lat': 40.7505,
                'location_lng': -73.9934,
                'is_tailor': False
            },
            {
                'username': 'sarah_johnson',
                'email': 'sarah@example.com',
                'name': 'Sarah Johnson',
                'phone': '+1234567893',
                'location_lat': 40.7614,
                'location_lng': -73.9776,
                'is_tailor': False
            },
            {
                'username': 'david_brown',
                'email': 'david@example.com',
                'name': 'David Brown',
                'phone': '+1234567894',
                'location_lat': 40.7282,
                'location_lng': -73.7949,
                'is_tailor': False
            }
        ]

        # Create regular users
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults=user_data
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created user: {user.name}')

        # Create tailor users
        tailors_data = [
            {
                'username': 'master_tailor',
                'email': 'master@tailor.com',
                'name': 'Master Tailor',
                'phone': '+1987654321',
                'location_lat': 40.7128,
                'location_lng': -74.0060,
                'is_tailor': True
            },
            {
                'username': 'elegant_studio',
                'email': 'elegant@tailor.com',
                'name': 'Elegant Studio',
                'phone': '+1987654322',
                'location_lat': 40.7589,
                'location_lng': -73.9851,
                'is_tailor': True
            },
            {
                'username': 'premium_couture',
                'email': 'premium@tailor.com',
                'name': 'Premium Couture',
                'phone': '+1987654323',
                'location_lat': 40.7505,
                'location_lng': -73.9934,
                'is_tailor': True
            }
        ]

        for tailor_data in tailors_data:
            user, created = User.objects.get_or_create(
                email=tailor_data['email'],
                defaults=tailor_data
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created tailor: {user.name}')

        # Create tailor profiles
        tailor_profiles_data = [
            {
                'user': User.objects.get(email='master@tailor.com'),
                'shop_name': 'Master Tailor Shop',
                'skills': ['suits', 'dresses', 'formal_wear', 'alterations'],
                'portfolio_photos': [],
                'availability': {
                    'monday': '9:00-18:00',
                    'tuesday': '9:00-18:00',
                    'wednesday': '9:00-18:00',
                    'thursday': '9:00-18:00',
                    'friday': '9:00-18:00',
                    'saturday': '10:00-16:00',
                    'sunday': 'closed'
                },
                'pricing': {
                    'suits': '$200-500',
                    'dresses': '$150-400',
                    'alterations': '$20-100'
                },
                'bio': 'Professional tailor with 20+ years of experience in custom clothing.',
                'address': '123 Fashion Street, New York, NY 10001',
                'rating': 4.8,
                'total_reviews': 15,
                'is_verified': True
            },
            {
                'user': User.objects.get(email='elegant@tailor.com'),
                'shop_name': 'Elegant Studio',
                'skills': ['wedding_dresses', 'evening_wear', 'bridal', 'formal_gowns'],
                'portfolio_photos': [],
                'availability': {
                    'monday': '10:00-19:00',
                    'tuesday': '10:00-19:00',
                    'wednesday': '10:00-19:00',
                    'thursday': '10:00-19:00',
                    'friday': '10:00-19:00',
                    'saturday': '9:00-17:00',
                    'sunday': 'closed'
                },
                'pricing': {
                    'wedding_dresses': '$500-2000',
                    'evening_wear': '$300-800',
                    'bridal': '$400-1500'
                },
                'bio': 'Specializing in elegant and sophisticated clothing for special occasions.',
                'address': '456 Style Avenue, New York, NY 10002',
                'rating': 4.9,
                'total_reviews': 22,
                'is_verified': True
            },
            {
                'user': User.objects.get(email='premium@tailor.com'),
                'shop_name': 'Premium Couture',
                'skills': ['business_suits', 'casual_wear', 'jackets', 'pants'],
                'portfolio_photos': [],
                'availability': {
                    'monday': '8:00-17:00',
                    'tuesday': '8:00-17:00',
                    'wednesday': '8:00-17:00',
                    'thursday': '8:00-17:00',
                    'friday': '8:00-17:00',
                    'saturday': '9:00-15:00',
                    'sunday': 'closed'
                },
                'pricing': {
                    'business_suits': '$300-800',
                    'casual_wear': '$100-300',
                    'jackets': '$150-400'
                },
                'bio': 'Modern tailoring with a focus on contemporary business and casual wear.',
                'address': '789 Design Boulevard, New York, NY 10003',
                'rating': 4.7,
                'total_reviews': 18,
                'is_verified': True
            }
        ]

        for profile_data in tailor_profiles_data:
            profile, created = TailorProfile.objects.get_or_create(
                user=profile_data['user'],
                defaults=profile_data
            )
            if created:
                self.stdout.write(f'Created tailor profile: {profile.shop_name}')

        # Create sample tailoring requests
        users = User.objects.filter(is_tailor=False)
        tailors = TailorProfile.objects.all()

        sample_measurements = [
            {
                'height': 175,
                'chest': 95,
                'waist': 85,
                'hips': 100,
                'shoulder_width': 45,
                'arm_length': 60,
                'inseam': 80
            },
            {
                'height': 165,
                'chest': 85,
                'waist': 70,
                'hips': 95,
                'shoulder_width': 40,
                'arm_length': 55,
                'inseam': 75
            },
            {
                'height': 180,
                'chest': 100,
                'waist': 90,
                'hips': 105,
                'shoulder_width': 48,
                'arm_length': 65,
                'inseam': 85
            }
        ]

        sample_notes = [
            'Need a formal suit for a wedding next month.',
            'Looking for a custom dress for a special event.',
            'Business suit for important meetings.',
            'Casual jacket for everyday wear.',
            'Alteration needed for existing garment.'
        ]

        statuses = ['pending', 'accepted', 'in_progress', 'completed']

        for i in range(5):
            user = random.choice(users)
            tailor = random.choice(tailors)
            measurements = random.choice(sample_measurements)
            notes = random.choice(sample_notes)
            status = random.choice(statuses)

            request = TailoringRequest.objects.create(
                user=user,
                tailor=tailor,
                notes=notes,
                status=status,
                measurements=measurements
            )
            
            # Set estimated completion for accepted/in_progress requests
            if status in ['accepted', 'in_progress']:
                request.estimated_completion = datetime.now().date() + timedelta(days=random.randint(7, 21))
                request.save()

            self.stdout.write(f'Created request: {user.name} -> {tailor.shop_name}')

        # Create sample reviews
        completed_requests = TailoringRequest.objects.filter(status='completed')
        for request in completed_requests[:3]:
            review = Review.objects.create(
                request=request,
                rating=random.randint(4, 5),
                comment=f'Excellent work! Very satisfied with the quality and service.'
            )
            self.stdout.write(f'Created review for {request.tailor.shop_name}')

        # Create sample notifications
        for user in User.objects.all()[:3]:
            Notification.objects.create(
                user=user,
                type='request_received',
                title='Welcome to TailorMatch!',
                message='Thank you for joining TailorMatch. Start by exploring nearby tailors!'
            )

        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data!')
        )
