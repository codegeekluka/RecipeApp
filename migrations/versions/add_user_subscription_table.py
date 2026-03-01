"""Add user subscription table for freemium model

Revision ID: add_user_subscription
Revises: ed3a7d8baa12
Create Date: 2025-01-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_user_subscription'
down_revision: Union[str, None] = 'ed3a7d8baa12'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create user_subscription table
    op.create_table(
        'user_subscription',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('sessions_used', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('is_premium', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('last_reset_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('last_used', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_user_subscription_user_id'), 'user_subscription', ['user_id'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_user_subscription_user_id'), table_name='user_subscription')
    op.drop_table('user_subscription')








