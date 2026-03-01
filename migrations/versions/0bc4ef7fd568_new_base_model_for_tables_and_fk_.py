"""New base model for tables and fk relation

Revision ID: 0bc4ef7fd568
Revises: cea8c50cf9be
Create Date: 2025-07-28 21:04:13.243677

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0bc4ef7fd568'
down_revision: Union[str, Sequence[str], None] = 'cea8c50cf9be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: align with base model (recipe.id, recipe.user_id)."""
    # Tables already created in cea8c50cf9be; only rename columns for later migrations.
    op.alter_column(
        'recipe',
        'rid',
        new_column_name='id',
        existing_type=sa.Integer(),
        existing_autoincrement=True,
    )
    op.alter_column(
        'recipe',
        'owner',
        new_column_name='user_id',
        existing_type=sa.Integer(),
        existing_nullable=True,
    )


def downgrade() -> None:
    """Downgrade schema: restore rid and owner."""
    op.alter_column(
        'recipe',
        'id',
        new_column_name='rid',
        existing_type=sa.Integer(),
        existing_autoincrement=True,
    )
    op.alter_column(
        'recipe',
        'user_id',
        new_column_name='owner',
        existing_type=sa.Integer(),
        existing_nullable=True,
    )
