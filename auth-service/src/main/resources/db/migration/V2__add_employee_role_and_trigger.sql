-- Create function to assign Employee role
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_roles (user_id, role_id)
    SELECT NEW.id, r.id
    FROM roles r
    WHERE r.name = 'Employee'
    AND NOT EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = NEW.id AND ur.role_id = r.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically assign Employee role to new users
DROP TRIGGER IF EXISTS tr_assign_employee_role ON users;
CREATE TRIGGER tr_assign_employee_role
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_role();

-- Assign Employee role to existing users who don't have it
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE r.name = 'Employee'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id AND ur.role_id = r.id
);